import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Product } from '@/types/database';
import { useProducts } from '@/hooks/useProducts';
import {
    getAiPriceSuggestion,
    AiPriceSuggestionResponse,
} from '@/lib/services/aiPricingService';
import {
    Sparkles,
    Bot,
    CheckCircle2,
    X,
    TrendingUp,
    TrendingDown,
    ShieldCheck,
    AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type AssistantState = 'idle' | 'loading' | 'suggestion' | 'saving';

interface AiPricingAssistantProps {
    /** The product to get a price suggestion for */
    product: Product;
    /** Callback after price is approved and saved */
    onPriceUpdated?: (productId: string, newPrice: number) => void;
    /** Extra CSS classes */
    className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AiPricingAssistant({
    product,
    onPriceUpdated,
    className,
}: AiPricingAssistantProps) {
    const { updateProduct } = useProducts();

    const [state, setState] = useState<AssistantState>('idle');
    const [suggestion, setSuggestion] = useState<AiPriceSuggestionResponse | null>(null);
    const [editedPrice, setEditedPrice] = useState<number>(0);

    // Recalculate margin reactively when editedPrice changes
    const currentMargin =
        editedPrice > 0 && product.custo_compra > 0
            ? ((editedPrice - product.custo_compra) / editedPrice) * 100
            : 0;

    const isLowMargin = currentMargin < 20;
    const isHighMargin = currentMargin >= 40;

    // -------------------------------------------------------------------------
    // Handlers
    // -------------------------------------------------------------------------

    /** Trigger the AI suggestion request */
    const handleRequestSuggestion = useCallback(async () => {
        setState('loading');
        setSuggestion(null);

        try {
            const result = await getAiPriceSuggestion(
                product.id,
                product.custo_compra || 0
            );

            setSuggestion(result);
            setEditedPrice(result.suggestedPrice);
            setState('suggestion');
        } catch (error) {
            toast.error('Erro ao consultar IA. Tente novamente.');
            setState('idle');
        }
    }, [product]);

    /** Cancel the suggestion (dismiss the card) */
    const handleCancel = useCallback(() => {
        setState('idle');
        setSuggestion(null);
        setEditedPrice(0);
    }, []);

    /** APPROVE: Write to Supabase via authenticated client (Human-in-the-Loop) */
    const handleApprove = useCallback(async () => {
        if (editedPrice <= 0) {
            toast.error('Preço inválido');
            return;
        }

        setState('saving');

        try {
            // =====================================================================
            // THIS IS THE ONLY WRITE OPERATION — via Supabase authenticated client
            // The AI NEVER touches the database. Only the human triggers this.
            // =====================================================================
            await updateProduct.mutateAsync({
                id: product.id,
                price: editedPrice,
            });

            toast.success('✅ Preço atualizado com sucesso!', {
                description: `${product.name}: R$ ${editedPrice.toFixed(2).replace('.', ',')}`,
                duration: 4000,
            });

            onPriceUpdated?.(product.id, editedPrice);

            // Reset to idle
            setState('idle');
            setSuggestion(null);
            setEditedPrice(0);
        } catch (error) {
            toast.error('Erro ao salvar preço. Tente novamente.');
            setState('suggestion'); // Go back to suggestion state so user can retry
        }
    }, [editedPrice, product, updateProduct, onPriceUpdated]);

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    const formatBRL = (value: number) =>
        new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);

    // -------------------------------------------------------------------------
    // Render: IDLE state — just the trigger button
    // -------------------------------------------------------------------------
    if (state === 'idle') {
        return (
            <Button
                variant="outline"
                size="sm"
                className={cn(
                    'gap-1.5 text-xs font-semibold rounded-xl h-9',
                    'border-purple-500/30 text-purple-400 hover:text-purple-300',
                    'hover:bg-purple-500/10 hover:border-purple-500/50',
                    'transition-all duration-200',
                    className
                )}
                onClick={handleRequestSuggestion}
                disabled={!product.custo_compra || product.custo_compra <= 0}
                title={
                    !product.custo_compra || product.custo_compra <= 0
                        ? 'Cadastre o custo de compra primeiro'
                        : 'Pedir sugestão de preço da IA'
                }
            >
                <Sparkles className="h-3.5 w-3.5" />
                ✨ Consultar IA
            </Button>
        );
    }

    // -------------------------------------------------------------------------
    // Render: LOADING state — elegant skeleton
    // -------------------------------------------------------------------------
    if (state === 'loading') {
        return (
            <Card
                className={cn(
                    'mt-3 border border-purple-500/20 bg-purple-500/5 rounded-2xl overflow-hidden',
                    className
                )}
            >
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center animate-pulse">
                            <Bot className="h-4 w-4 text-purple-400" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <Skeleton className="h-3.5 w-32 bg-purple-500/10" />
                            <Skeleton className="h-3 w-48 bg-purple-500/10" />
                        </div>
                        <div className="h-6 w-6 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-12 flex-1 bg-purple-500/10 rounded-xl" />
                        <Skeleton className="h-12 w-20 bg-purple-500/10 rounded-xl" />
                    </div>
                    <p className="text-xs text-purple-400/60 text-center animate-pulse">
                        🧠 IA analisando custo, categoria e risco de quebra...
                    </p>
                </CardContent>
            </Card>
        );
    }

    // -------------------------------------------------------------------------
    // Render: SUGGESTION / SAVING state — Decision Card
    // -------------------------------------------------------------------------
    return (
        <>
            <Card
                className={cn(
                    'mt-3 border rounded-2xl overflow-hidden transition-all duration-300',
                    'border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-purple-500/10',
                    'shadow-lg shadow-purple-500/5',
                    className
                )}
            >
                {/* Purple accent line */}
                <div className="h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-indigo-500" />

                <CardContent className="p-4 space-y-4">
                    {/* Header: AI Assistant label */}
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Bot className="h-3.5 w-3.5 text-purple-400" />
                        </div>
                        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                            Assistente de Precificação
                        </span>
                        {suggestion && (
                            <Badge
                                variant="outline"
                                className="ml-auto text-[10px] border-purple-500/30 text-purple-400 bg-purple-500/10"
                            >
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                95% confiança
                            </Badge>
                        )}
                    </div>

                    {/* Reasoning text */}
                    {suggestion?.reasoning && (
                        <p className="text-xs text-muted-foreground italic leading-relaxed bg-muted/30 rounded-xl p-3 border border-border/50">
                            💡 {suggestion.reasoning}
                        </p>
                    )}

                    {/* Price + Margin row */}
                    <div className="grid grid-cols-5 gap-3 items-end">
                        {/* Custo (read-only) */}
                        <div className="col-span-2 space-y-1">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                Custo Compra
                            </span>
                            <p className="text-base font-bold tabular-nums text-foreground">
                                {formatBRL(product.custo_compra || 0)}
                            </p>
                        </div>

                        {/* Suggested Price (editable) */}
                        <div className="col-span-2 space-y-1">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                Preço Sugerido
                            </span>
                            <Input
                                type="number"
                                step="0.01"
                                className={cn(
                                    'w-full text-lg font-black tabular-nums text-purple-400',
                                    'rounded-xl border-2 border-purple-500/30 h-10',
                                    'bg-purple-500/5 focus-visible:ring-purple-500/50'
                                )}
                                value={editedPrice || ''}
                                onChange={(e) => setEditedPrice(parseFloat(e.target.value) || 0)}
                            />
                        </div>

                        {/* Margin */}
                        <div className="col-span-1 space-y-1 text-right">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                Margem
                            </span>
                            <div className="flex items-center justify-end gap-1">
                                {isLowMargin ? (
                                    <AlertTriangle className="h-3 w-3 text-red-400" />
                                ) : isHighMargin ? (
                                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                                ) : (
                                    <TrendingDown className="h-3 w-3 text-amber-400" />
                                )}
                                <span
                                    className={cn(
                                        'text-lg font-black tabular-nums leading-none',
                                        isLowMargin
                                            ? 'text-red-400'
                                            : isHighMargin
                                                ? 'text-emerald-400'
                                                : 'text-amber-400'
                                    )}
                                >
                                    {currentMargin.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-5 gap-2 pt-1">
                        <Button
                            variant="ghost"
                            className="col-span-2 h-12 text-sm font-semibold rounded-xl gap-1.5 text-muted-foreground"
                            onClick={handleCancel}
                            disabled={state === 'saving'}
                        >
                            <X className="h-4 w-4" />
                            Descartar
                        </Button>
                        <Button
                            className={cn(
                                'col-span-3 h-12 text-sm font-bold rounded-xl gap-1.5',
                                'bg-emerald-600 hover:bg-emerald-500 text-white',
                                'shadow-lg shadow-emerald-600/20',
                                'active:scale-95 transition-all duration-150',
                                state === 'saving' && 'opacity-70'
                            )}
                            onClick={handleApprove}
                            disabled={state === 'saving' || editedPrice <= 0}
                        >
                            {state === 'saving' ? (
                                <>
                                    <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    APROVAR PREÇO
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Security footer */}
                    <p className="text-[10px] text-muted-foreground/50 text-center flex items-center justify-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Gravação autenticada via Supabase • A IA não tem acesso de escrita
                    </p>
                </CardContent>
            </Card>

        </>
    );
}
