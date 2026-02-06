// Types for the application

export type ProductCategory = 'frutas' | 'verduras' | 'legumes' | 'temperos' | 'outros';
export type UnitType = 'kg' | 'un' | 'maco' | 'bandeja' | 'caixa' | 'engradado' | 'saco' | 'penca';
export type BreakageReason = 'vencido' | 'danificado' | 'furto' | 'erro_operacional' | 'outro';

// Enums de conversão e visual
export type UnidadeVenda = 'PARA_UN' | 'PARA_KG';
export type CategoriaVisual = 'FRUTA' | 'LEGUME' | 'VERDURA' | 'TEMPERO' | 'OUTROS';

// New entity types
export type PersonType = 'funcionario' | 'cliente' | 'motorista';
export type PackagingMaterial = 'plastico' | 'madeira' | 'papelao' | 'isopor';
export type LocationType = 'box_ceasa' | 'camara_fria' | 'pulmao' | 'deposito' | 'gondola';

export interface Person {
  id: string;
  name: string;
  type: PersonType;
  cpf_cnpj: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Packaging {
  id: string;
  name: string;
  tare_weight: number;
  material: PackagingMaterial;
  is_returnable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  max_capacity: number | null;
  temperature_min: number | null;
  temperature_max: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  payment_terms: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  plu: string;
  name: string;
  category: ProductCategory;
  categoria_visual: CategoriaVisual | null;
  unit: UnitType;
  unidade_venda: UnidadeVenda | null; // PARA_UN = unidades, PARA_KG = quilos
  peso_por_unidade: number; // Peso em kg por unidade de venda
  price: number;
  min_stock: number;
  is_active: boolean;
  codigo_balanca: string | null;
  custo_compra: number;
  supplier_id: string | null;
  shelf_life: number;
  ultimo_preco_caixa: number | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
}

export interface StockBatch {
  id: string;
  product_id: string;
  location_id: string | null;
  quantity: number;
  cost_per_unit: number;
  expiry_date: string | null;
  received_at: string;
  created_at: string;
  product?: Product;
  location?: Location;
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

// Receiving Photos
export interface ReceivingPhoto {
  id: string;
  order_id: string;
  photo_url: string;
  file_name: string;
  file_size: number | null;
  captured_at: string;
  notes: string | null;
  created_at: string;
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
  bandeja: 'Bandeja',
  caixa: 'Caixa',
  engradado: 'Engradado',
  saco: 'Saco',
  penca: 'Penca',
};

export const BREAKAGE_REASON_LABELS: Record<BreakageReason, string> = {
  vencido: 'Amadureceu Demais',
  danificado: 'Veio Estragado do Fornecedor',
  furto: 'Furto',
  erro_operacional: 'Erro Operacional',
  outro: 'Outro'
};

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  funcionario: 'Funcionário',
  cliente: 'Cliente',
  motorista: 'Motorista'
};

export const PACKAGING_MATERIAL_LABELS: Record<PackagingMaterial, string> = {
  plastico: 'Plástico',
  madeira: 'Madeira',
  papelao: 'Papelão',
  isopor: 'Isopor'
};

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  box_ceasa: 'Box CEASA',
  camara_fria: 'Câmara Fria',
  pulmao: 'Pulmão',
  deposito: 'Depósito',
  gondola: 'Gôndola'
};

// Purchase Order Types
export type PurchaseOrderStatus = 'rascunho' | 'enviado' | 'recebido' | 'cancelado' | 'fechado';

export interface PurchaseOrder {
  id: string;
  supplier_id: string | null;
  status: PurchaseOrderStatus;
  total_estimated: number;
  total_received: number | null;
  created_by: string | null;
  notes: string | null;
  offline_id: string | null;
  created_at: string;
  updated_at: string;
  received_at: string | null;
  edited_at: string | null;
  supplier?: Supplier;
  creator?: Person;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit: string;
  estimated_kg: number;
  unit_cost_estimated: number | null;
  unit_cost_actual: number | null;
  quantity_received: number | null;
  packaging_id: string | null;
  tare_total: number;
  created_at: string;
  product?: Product;
  packaging?: Packaging;
}

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  recebido: 'Recebido',
  cancelado: 'Cancelado',
  fechado: 'Fechado'
};
