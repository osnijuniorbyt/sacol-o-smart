import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NumericInputModal } from '@/components/ui/numeric-input-modal';
import {
    PricingApproval,
    formatBRL,
    formatPercent,
    isCostAboveHistorical,
    calculateMargin,
} from '@/types/pricing';
import {
    CheckCircle2,
    Pencil,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Emoji map for product categories
// ---------------------------------------------------------------------------
const CATEGORY_EMOJI: Record<string, string> = {
    frutas: '🍎',
    verduras: '🥬',
    legumes: '🥕',
    temperos: '🌿',
    outros: '📦',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ApprovalCardProps {
    approval: PricingApproval;
    onApprove: (id: string, price: number) => void;
    onUpdatePrice: (id: string, newPrice: number) => void;
    isExiting?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ApprovalCard({
    approval,
    onApprove,
    onUpdatePrice,
    isExiting = false,
}: ApprovalCardProps) {
    const [isKeypadOpen, setIsKeypadOpen] = useState(false);
    const [editValue, setEditValue] = useState('');

    const {
        product,
        supplier,
        real_net_cost,
        suggested_price,
        projected_margin,
        historical_avg_cost,
    } = approval;

    const emoji = CATEGORY_EMOJI[product.category] || '📦';
    const costAboveHistorical = isCostAboveHistorical(real_net_cost, historical_avg_cost);
    const isHighMargin = projected_margin >= 40;
    const isLowMargin = projected_margin < 20;

    // -------------------------------------------------------------------------
    // Handlers
    // -------------------------------------------------------------------------
    const handleOpenKeypad = useCallback(() => {
        setEditValue(suggested_price.toFixed(2).replace('.', ','));
        setIsKeypadOpen(true);
    }, [suggested_price]);

    const handleConfirmKeypad = useCallback(
        (value: string) => {
            const numericValue = parseFloat(value.replace(',', '.'));
            if (!isNaN(numericValue) && numericValue > 0) {
                onUpdatePrice(approval.id, numericValue);
            }
        },
        [approval.id, onUpdatePrice]
    );

    const handleApprove = useCallback(() => {
        onApprove(approval.id, suggested_price);
    }, [approval.id, suggested_price, onApprove]);

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    return (
        <>
            <Card
                className={cn(
                    'relative overflow-hidden transition-all duration-500 ease-out',
                    'bg-card border border-border/50 rounded-2xl shadow-sm',
                    'hover:shadow-md hover:border-border',
                    isExiting && 'opacity-0 scale-95 -translate-x-full max-h-0 mb-0 p-0 border-0'
                )}
            >
                {/* Top accent line based on margin health */}
                <div
                    className={cn(
                        'absolute top-0 left-0 right-0 h-1 rounded-t-2xl',
                        isLowMargin
                            ? 'bg-gradient-to-r from-red-500 to-red-400'
                            : isHighMargin
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                : 'bg-gradient-to-r from-amber-500 to-amber-400'
                    )}
                />

                <CardContent className="p-4 pt-5 space-y-4">
                    {/* ============================================================= */}
                    {/* HEADER: Product + Supplier + Badge                            */}
                    {/* ============================================================= */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Product emoji circle */}
                            <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center text-2xl">
                                {emoji}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-base text-foreground truncate">
                                    {product.name}
                                </h3>
                                {supplier && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                        <Building2 className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{supplier.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Margin badge */}
                        <Badge
                            variant="outline"
                            className={cn(
                                'flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg border',
                                isLowMargin
                                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                    : isHighMargin
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            )}
                        >
                            {isLowMargin ? (
                                <TrendingDown className="h-3 w-3 mr-1" />
                            ) : (
                                <TrendingUp className="h-3 w-3 mr-1" />
                            )}
                            {formatPercent(projected_margin)}
                        </Badge>
                    </div>

                    {/* ============================================================= */}
                    {/* BODY: Cost | Price (editable) | Margin                        */}
                    {/* ============================================================= */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* Left: Real Net Cost */}
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                Custo Real
                            </span>
                            <p
                                className={cn(
                                    'text-lg font-bold tabular-nums leading-none',
                                    costAboveHistorical ? 'text-red-400' : 'text-foreground'
                                )}
                            >
                                {formatBRL(real_net_cost)}
                            </p>
                            {costAboveHistorical && (
                                <div className="flex items-center gap-1 mt-1">
                                    <AlertTriangle className="h-3 w-3 text-red-400" />
                                    <span className="text-[10px] text-red-400 font-medium">
                                        Acima da média
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Center: Suggested Price (Interactive) */}
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                Preço Venda
                            </span>
                            <button
                                onClick={handleOpenKeypad}
                                className={cn(
                                    'w-full text-left group cursor-pointer',
                                    'rounded-xl border-2 border-dashed border-primary/30',
                                    'bg-primary/5 px-2 py-1.5',
                                    'hover:border-primary/60 hover:bg-primary/10',
                                    'active:scale-95 transition-all duration-150'
                                )}
                            >
                                <p className="text-lg font-bold tabular-nums leading-none text-primary">
                                    {formatBRL(suggested_price)}
                                </p>
                                <span className="text-[9px] text-primary/60 group-hover:text-primary/80">
                                    Toque para editar
                                </span>
                            </button>
                        </div>

                        {/* Right: Projected Margin */}
                        <div className="space-y-1 text-right">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                Margem
                            </span>
                            <p
                                className={cn(
                                    'text-2xl font-black tabular-nums leading-none',
                                    isLowMargin
                                        ? 'text-red-400'
                                        : isHighMargin
                                            ? 'text-emerald-400'
                                            : 'text-amber-400'
                                )}
                            >
                                {formatPercent(projected_margin)}
                            </p>
                        </div>
                    </div>

                    {/* ============================================================= */}
                    {/* FOOTER: Action Buttons                                        */}
                    {/* ============================================================= */}
                    <div className="grid grid-cols-5 gap-2 pt-1">
                        {/* Edit button (secondary) — 2/5 width */}
                        <Button
                            variant="outline"
                            className="col-span-2 h-12 text-sm font-semibold rounded-xl gap-1.5 border-border/50"
                            onClick={handleOpenKeypad}
                        >
                            <Pencil className="h-4 w-4" />
                            Editar
                        </Button>

                        {/* Approve button (primary/green) — 3/5 width */}
                        <Button
                            className={cn(
                                'col-span-3 h-12 text-sm font-bold rounded-xl gap-1.5',
                                'bg-emerald-600 hover:bg-emerald-500 text-white',
                                'shadow-lg shadow-emerald-600/20',
                                'active:scale-95 transition-all duration-150'
                            )}
                            onClick={handleApprove}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Aprovar Preço
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* NumericInputModal — reuses existing project component */}
            <NumericInputModal
                open={isKeypadOpen}
                onOpenChange={setIsKeypadOpen}
                value={editValue}
                onChange={setEditValue}
                onConfirm={handleConfirmKeypad}
                title="Preço de Venda (R$)"
                label="Custo Total Pago (R$)"
                unit="R$"
                allowDecimal
                maxDecimals={2}
                minValue={0.01}
            />
        </>
    );
}
