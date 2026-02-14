import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { NumericKeypad } from '@/components/ui/numeric-keypad';
import { useIsMobile } from '@/hooks/use-mobile';
import { DollarSign, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PricingItem {
  product_id: string;
  product_name: string;
  custo_kg: number;
  margem: number;
  preco_venda: number;
}

interface PricingCardProps {
  items: PricingItem[];
  onChange: (items: PricingItem[]) => void;
}

function calcPreco(custo: number, margem: number): number {
  if (margem >= 100) return custo * 10; // cap
  return custo / (1 - margem / 100);
}

function calcMargem(custo: number, preco: number): number {
  if (preco <= 0 || preco <= custo) return 0;
  return ((preco - custo) / preco) * 100;
}

export function PricingCard({ items, onChange }: PricingCardProps) {
  const isMobile = useIsMobile();
  const [editingField, setEditingField] = useState<{
    index: number;
    field: 'margem' | 'preco';
  } | null>(null);
  const [keypadValue, setKeypadValue] = useState('');

  const updateItem = useCallback((index: number, field: 'margem' | 'preco', rawValue: number) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === 'margem') {
      item.margem = Math.min(rawValue, 99.9);
      item.preco_venda = Math.round(calcPreco(item.custo_kg, item.margem) * 100) / 100;
    } else {
      item.preco_venda = rawValue;
      item.margem = Math.round(calcMargem(item.custo_kg, rawValue) * 10) / 10;
    }

    updated[index] = item;
    onChange(updated);
  }, [items, onChange]);

  const openKeypad = (index: number, field: 'margem' | 'preco') => {
    const item = items[index];
    const currentVal = field === 'margem' ? item.margem : item.preco_venda;
    setKeypadValue(currentVal > 0 ? currentVal.toString().replace('.', ',') : '');
    setEditingField({ index, field });
  };

  const handleKeypadConfirm = () => {
    if (!editingField) return;
    const numVal = parseFloat(keypadValue.replace(',', '.')) || 0;
    updateItem(editingField.index, editingField.field, numVal);
    setEditingField(null);
    setKeypadValue('');
  };

  const handleKeypadCancel = () => {
    setEditingField(null);
    setKeypadValue('');
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Definir Preços de Venda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, index) => (
            <div key={item.product_id}>
              {index > 0 && <Separator className="mb-3" />}
              <p className="text-sm font-medium mb-2 truncate">{item.product_name}</p>

              <div className="grid grid-cols-3 gap-2">
                {/* Custo/kg - read only */}
                <div>
                  <Label className="text-[10px] text-destructive font-medium">Custo/kg</Label>
                  <div className="h-12 flex items-center font-mono text-sm bg-destructive/10 text-destructive rounded-md px-2">
                    R$ {item.custo_kg.toFixed(2)}
                  </div>
                </div>

                {/* Margem */}
                <div>
                  <Label className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Margem %</Label>
                  {isMobile ? (
                    <button
                      type="button"
                      className="h-12 w-full flex items-center justify-center font-mono text-sm bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md"
                      onClick={() => openKeypad(index, 'margem')}
                    >
                      {item.margem.toFixed(1)}%
                    </button>
                  ) : (
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={item.margem}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        updateItem(index, 'margem', v);
                      }}
                      className="h-12 font-mono text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                    />
                  )}
                </div>

                {/* Preço Venda */}
                <div>
                  <Label className="text-[10px] text-green-600 dark:text-green-400 font-medium">Venda/kg</Label>
                  {isMobile ? (
                    <button
                      type="button"
                      className="h-12 w-full flex items-center justify-center font-mono text-sm bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-md"
                      onClick={() => openKeypad(index, 'preco')}
                    >
                      R$ {item.preco_venda.toFixed(2)}
                    </button>
                  ) : (
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={item.preco_venda}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        updateItem(index, 'preco', v);
                      }}
                      className="h-12 font-mono text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Keypad overlay for mobile */}
      {editingField && isMobile && (
        <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div>
              <p className="font-medium text-sm">{items[editingField.index]?.product_name}</p>
              <p className="text-xs text-muted-foreground">
                {editingField.field === 'margem' ? 'Editar Margem (%)' : 'Editar Preço Venda (R$/kg)'}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleKeypadCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="w-full max-w-xs">
              <NumericKeypad
                value={keypadValue}
                onChange={setKeypadValue}
                onConfirm={handleKeypadConfirm}
                onCancel={handleKeypadCancel}
                allowDecimal
                maxDecimals={2}
                maxValue={editingField.field === 'margem' ? 99.9 : 999}
                unit={editingField.field === 'margem' ? '%' : 'R$/kg'}
                label={editingField.field === 'margem' ? 'Margem' : 'Preço Venda'}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
