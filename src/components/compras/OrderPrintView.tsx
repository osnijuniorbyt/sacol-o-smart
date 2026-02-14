import { PurchaseOrder } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderPrintViewProps {
  order: PurchaseOrder;
}

export function OrderPrintView({ order }: OrderPrintViewProps) {
  return (
    <div className="print-order-view hidden print:block p-8 text-black bg-white">
      {/* Header */}
      <div className="text-center mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">Pedido de Compra</h1>
        <p className="text-sm text-gray-600 mt-1">
          {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>

      {/* Supplier Info */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-1">Fornecedor</h2>
        <p className="text-base">{order.supplier?.name || 'Não definido'}</p>
        {order.supplier?.phone && (
          <p className="text-sm text-gray-600">Tel: {order.supplier.phone}</p>
        )}
        {order.supplier?.cnpj && (
          <p className="text-sm text-gray-600">CNPJ: {order.supplier.cnpj}</p>
        )}
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-2 text-sm font-semibold">#</th>
            <th className="text-left py-2 text-sm font-semibold">Produto</th>
            <th className="text-right py-2 text-sm font-semibold">Qtd</th>
            <th className="text-right py-2 text-sm font-semibold">Unidade</th>
            <th className="text-right py-2 text-sm font-semibold">Custo Est.</th>
            <th className="text-right py-2 text-sm font-semibold">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, index) => {
            const cost = item.unit_cost_estimated || 0;
            const subtotal = item.quantity * cost;
            return (
              <tr key={item.id} className="border-b border-gray-300">
                <td className="py-2 text-sm">{index + 1}</td>
                <td className="py-2 text-sm">{item.product?.name || 'Produto'}</td>
                <td className="py-2 text-sm text-right font-mono">{item.quantity}</td>
                <td className="py-2 text-sm text-right">{item.unit}</td>
                <td className="py-2 text-sm text-right font-mono">
                  R$ {cost.toFixed(2)}
                </td>
                <td className="py-2 text-sm text-right font-mono">
                  R$ {subtotal.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black">
            <td colSpan={5} className="py-3 text-right font-bold">Total Estimado:</td>
            <td className="py-3 text-right font-bold font-mono">
              R$ {order.total_estimated.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Notes */}
      {order.notes && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-1">Observações:</h3>
          <p className="text-sm text-gray-700">{order.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-4 border-t text-center text-xs text-gray-500">
        <p>Horticampos • Pedido #{order.id.slice(0, 8)}</p>
      </div>
    </div>
  );
}
