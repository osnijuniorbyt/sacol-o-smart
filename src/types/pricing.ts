// =============================================================================
// PRICING APPROVAL TYPES — Human-in-the-Loop (Agentic Platform)
// =============================================================================
// These types form the contract between the future AI backend and the
// frontend "Inbox" UI. The frontend acts as a validation layer where
// the human operator approves, edits, or rejects AI suggestions.
// =============================================================================

import { Product, Supplier } from './database';

// ---------------------------------------------------------------------------
// Approval Status Enum
// ---------------------------------------------------------------------------
export type ApprovalStatus =
    | 'pending_ai'     // AI is still computing the suggestion
    | 'pending_human'  // Ready for human review
    | 'approved';      // Human approved, price is live

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
    pending_ai: 'Calculando...',
    pending_human: 'Aguardando Aprovação',
    approved: 'Aprovado',
};

export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
    pending_ai: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pending_human: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

// ---------------------------------------------------------------------------
// Pricing Approval Entity
// ---------------------------------------------------------------------------
export interface PricingApproval {
    /** Unique identifier for this approval request */
    id: string;

    /** The product being priced */
    product_id: string;
    product: Product;

    /** The supplier who provided this batch (nullable for stock items) */
    supplier_id: string | null;
    supplier: Supplier | null;

    /** The purchase order that originated this item */
    order_id: string | null;

    // --- Cost Breakdown ---
    /** Raw cost from the purchase order (antes de abater tara/quebra) */
    raw_cost: number;
    /** Net cost after deducting tare weight and breakage */
    real_net_cost: number;

    // --- AI Suggestion ---
    /** Selling price suggested by the system/AI */
    suggested_price: number;
    /** Projected margin percentage based on suggested_price vs real_net_cost */
    projected_margin: number;

    /** Historical average cost for comparison (highlighted if current > avg) */
    historical_avg_cost: number | null;

    // --- Approval State ---
    approval_status: ApprovalStatus;

    /** The final price approved by the human (may differ from suggested_price) */
    approved_price: number | null;
    /** The user who approved (future: ties to Supabase auth user) */
    approved_by: string | null;
    approved_at: string | null;

    // --- Timestamps ---
    created_at: string;
    updated_at: string;
}

// ---------------------------------------------------------------------------
// Generic Agentic Action (future-proof for other modules)
// ---------------------------------------------------------------------------
export type AgenticActionType = 'pricing' | 'reorder' | 'breakage_alert';

export interface AgenticAction<T = unknown> {
    id: string;
    type: AgenticActionType;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: ApprovalStatus;
    payload: T;
    created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Calculate margin % from cost and price */
export function calculateMargin(cost: number, price: number): number {
    if (cost <= 0 || price <= 0) return 0;
    return ((price - cost) / price) * 100;
}

/** Determine if cost is above historical average */
export function isCostAboveHistorical(
    currentCost: number,
    historicalAvg: number | null
): boolean {
    if (historicalAvg === null || historicalAvg <= 0) return false;
    return currentCost > historicalAvg * 1.05; // 5% tolerance
}

/** Format currency in BRL */
export function formatBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

/** Format percentage */
export function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
}
