import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { Supplier } from '@/hooks/useSuppliers';

interface SupplierSelectorProps {
  suppliers: Supplier[];
  selectedSupplier: string;
  onSupplierChange: (value: string) => void;
}

export function SupplierSelector({ 
  suppliers, 
  selectedSupplier, 
  onSupplierChange 
}: SupplierSelectorProps) {
  const selectedSupplierData = suppliers.find(s => s.id === selectedSupplier);

  return (
    <Card className="border-2 border-primary">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5" />
          1. Selecione o Fornecedor
          <Badge variant="destructive">OBRIGATÓRIO</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedSupplier} onValueChange={onSupplierChange}>
          <SelectTrigger className="h-14 text-lg">
            <SelectValue placeholder="Clique para selecionar o fornecedor..." />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {suppliers.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Nenhum fornecedor cadastrado
              </div>
            ) : (
              suppliers.map(supplier => (
                <SelectItem key={supplier.id} value={supplier.id} className="py-3">
                  <div>
                    <div className="font-medium">{supplier.name}</div>
                    {supplier.cnpj && (
                      <div className="text-xs text-muted-foreground">CNPJ: {supplier.cnpj}</div>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        {selectedSupplierData && (
          <div className="mt-3 p-3 bg-primary/10 rounded-lg">
            <p className="font-medium text-primary">
              ✓ {selectedSupplierData.name}
            </p>
            {selectedSupplierData.phone && (
              <p className="text-sm text-muted-foreground">Tel: {selectedSupplierData.phone}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
