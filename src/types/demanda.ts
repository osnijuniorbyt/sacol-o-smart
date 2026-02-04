// Enums de Demanda
export type StatusLoteDemanda = 'ABERTO' | 'EM_COMPRA' | 'RECEBIDO' | 'FECHADO';
export type PrioridadeDemanda = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
export type CategoriaVisual = 'FRUTA' | 'LEGUME' | 'VERDURA' | 'TEMPERO' | 'OUTROS';

// Lote de Demanda (Pedido da Loja)
export interface LoteDemanda {
  id: string;
  titulo: string;
  data_necessidade: string; // DATE
  status: StatusLoteDemanda;
  prioridade: PrioridadeDemanda;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Item de Demanda
export interface ItemDemanda {
  id: string;
  lote_id: string;
  product_id: string;
  qtd_sugerida: number;
  prioridade: PrioridadeDemanda;
  categoria: CategoriaVisual | null;
  observacoes: string | null;
  created_at: string;
}

// Item com dados do produto (para exibição)
export interface ItemDemandaComProduto extends ItemDemanda {
  product?: {
    id: string;
    name: string;
    category: string;
    unit: string;
    image_url: string | null;
  };
}

// Lote com itens (para exibição)
export interface LoteDemandaComItens extends LoteDemanda {
  itens: ItemDemandaComProduto[];
}

// Inputs para criação
export interface CreateLoteDemandaInput {
  titulo: string;
  data_necessidade: string;
  prioridade?: PrioridadeDemanda;
  observacoes?: string;
}

export interface CreateItemDemandaInput {
  lote_id: string;
  product_id: string;
  qtd_sugerida: number;
  prioridade?: PrioridadeDemanda;
  categoria?: CategoriaVisual;
  observacoes?: string;
}

// Constantes para UI
export const STATUS_LABELS: Record<StatusLoteDemanda, string> = {
  ABERTO: 'Aberto',
  EM_COMPRA: 'Em Compra',
  RECEBIDO: 'Recebido',
  FECHADO: 'Fechado',
};

export const PRIORIDADE_LABELS: Record<PrioridadeDemanda, string> = {
  BAIXA: 'Baixa',
  NORMAL: 'Normal',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export const PRIORIDADE_COLORS: Record<PrioridadeDemanda, string> = {
  BAIXA: 'bg-slate-500',
  NORMAL: 'bg-blue-500',
  ALTA: 'bg-amber-500',
  URGENTE: 'bg-red-500',
};

export const CATEGORIA_LABELS: Record<CategoriaVisual, string> = {
  FRUTA: 'Frutas',
  LEGUME: 'Legumes',
  VERDURA: 'Verduras',
  TEMPERO: 'Temperos',
  OUTROS: 'Outros',
};

export const CATEGORIA_COLORS: Record<CategoriaVisual, string> = {
  FRUTA: 'bg-red-500',
  LEGUME: 'bg-orange-500',
  VERDURA: 'bg-green-500',
  TEMPERO: 'bg-purple-500',
  OUTROS: 'bg-gray-500',
};
