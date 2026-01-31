// Types for the application

export type ProductCategory = 'frutas' | 'verduras' | 'legumes' | 'temperos' | 'outros';
export type UnitType = 'kg' | 'un' | 'maco' | 'bandeja';
export type BreakageReason = 'vencido' | 'danificado' | 'furto' | 'erro_operacional' | 'outro';

export interface Product {
  id: string;
  plu: string;
  name: string;
  category: ProductCategory;
  unit: UnitType;
  price: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockBatch {
  id: string;
  product_id: string;
  quantity: number;
  cost_per_unit: number;
  expiry_date: string | null;
  received_at: string;
  created_at: string;
  product?: Product;
}

export interface Sale {
  id: string;
  total: number;
  items_count: number;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  batch_id: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
  product?: Product;
}

export interface Breakage {
  id: string;
  product_id: string;
  batch_id: string | null;
  quantity: number;
  cost_per_unit: number;
  total_loss: number;
  reason: BreakageReason;
  notes: string | null;
  created_at: string;
  product?: Product;
  batch?: StockBatch;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface BarcodeData {
  plu: string;
  weight: number; // in kg
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  frutas: 'Frutas',
  verduras: 'Verduras',
  legumes: 'Legumes',
  temperos: 'Temperos',
  outros: 'Outros'
};

export const UNIT_LABELS: Record<UnitType, string> = {
  kg: 'Quilograma',
  un: 'Unidade',
  maco: 'Maço',
  bandeja: 'Bandeja'
};

export const BREAKAGE_REASON_LABELS: Record<BreakageReason, string> = {
  vencido: 'Vencido',
  danificado: 'Danificado',
  furto: 'Furto',
  erro_operacional: 'Erro Operacional',
  outro: 'Outro'
};
