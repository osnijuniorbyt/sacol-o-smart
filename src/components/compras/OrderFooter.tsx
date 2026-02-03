import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface OrderFooterProps {
  supplierName: string;
  totalItens: number;
  totalPedido: number;
  isSaving: boolean;
  onEnviarPedido: () => void;
}

export function OrderFooter({
  supplierName,
  totalItens,
  totalPedido,
  isSaving,
  onEnviarPedido,
}: OrderFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 fixed-bottom-safe pl-safe pr-safe bg-background border-t shadow-lg z-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between mb-2 text-sm">
          <span>Fornecedor: <strong>{supplierName}</strong></span>
          <span>{totalItens} caixas {totalPedido > 0 && `• R$ ${totalPedido.toFixed(2)}`}</span>
        </div>
        <Button 
          onClick={onEnviarPedido}
          disabled={isSaving}
          className="w-full h-14 text-lg"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Send className="mr-2 h-5 w-5" />
          )}
          {isSaving ? 'Enviando...' : 'Enviar Pedido'}
        </Button>
      </div>
    </div>
  );
}
