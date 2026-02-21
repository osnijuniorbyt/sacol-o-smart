import { useState, useCallback } from 'react';
import { PricingApproval, calculateMargin } from '@/types/pricing';
import { toast } from 'sonner';

// =============================================================================
// MOCK DATA — Will be replaced by Supabase query in production
// =============================================================================
// These simulate 3 products that were just received and priced by the AI.
// In the future, this hook will fetch from:
//   supabase.from('pricing_approvals').select('*').eq('approval_status', 'pending_human')
// =============================================================================

const MOCK_APPROVALS: PricingApproval[] = [
    {
        id: 'approval-001',
        product_id: 'prod-banana',
        product: {
            id: 'prod-banana',
            plu: '00001',
            name: 'Banana Prata',
            category: 'frutas',
            categoria_visual: 'FRUTA',
            unit: 'kg',
            unidade_venda: 'PARA_KG',
            peso_por_unidade: 1,
            price: 5.99,
            min_stock: 10,
            is_active: true,
            codigo_balanca: null,
            custo_compra: 2.80,
            supplier_id: 'sup-001',
            shelf_life: 5,
            ultimo_preco_caixa: 56.00,
            image_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        supplier_id: 'sup-001',
        supplier: {
            id: 'sup-001',
            name: 'Produtor João Silva',
            cnpj: null,
            phone: '(11) 99999-0001',
            payment_terms: 7,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        order_id: 'order-001',
        raw_cost: 3.20,
        real_net_cost: 2.85,
        suggested_price: 6.49,
        projected_margin: calculateMargin(2.85, 6.49),
        historical_avg_cost: 2.60,
        approval_status: 'pending_human',
        approved_price: null,
        approved_by: null,
        approved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'approval-002',
        product_id: 'prod-tomate',
        product: {
            id: 'prod-tomate',
            plu: '00010',
            name: 'Tomate Italiano',
            category: 'legumes',
            categoria_visual: 'LEGUME',
            unit: 'kg',
            unidade_venda: 'PARA_KG',
            peso_por_unidade: 1,
            price: 8.99,
            min_stock: 15,
            is_active: true,
            codigo_balanca: null,
            custo_compra: 5.50,
            supplier_id: 'sup-002',
            shelf_life: 7,
            ultimo_preco_caixa: 110.00,
            image_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        supplier_id: 'sup-002',
        supplier: {
            id: 'sup-002',
            name: 'Fazenda Verde',
            cnpj: '12.345.678/0001-90',
            phone: '(11) 98888-0002',
            payment_terms: 14,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        order_id: 'order-002',
        raw_cost: 6.10,
        real_net_cost: 5.75,
        suggested_price: 12.99,
        projected_margin: calculateMargin(5.75, 12.99),
        historical_avg_cost: 4.80,
        approval_status: 'pending_human',
        approved_price: null,
        approved_by: null,
        approved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'approval-003',
        product_id: 'prod-alface',
        product: {
            id: 'prod-alface',
            plu: '00020',
            name: 'Alface Crespa',
            category: 'verduras',
            categoria_visual: 'VERDURA',
            unit: 'un',
            unidade_venda: 'PARA_UN',
            peso_por_unidade: 0.3,
            price: 3.49,
            min_stock: 20,
            is_active: true,
            codigo_balanca: null,
            custo_compra: 1.20,
            supplier_id: 'sup-001',
            shelf_life: 3,
            ultimo_preco_caixa: null,
            image_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        supplier_id: 'sup-001',
        supplier: {
            id: 'sup-001',
            name: 'Produtor João Silva',
            cnpj: null,
            phone: '(11) 99999-0001',
            payment_terms: 7,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        order_id: 'order-003',
        raw_cost: 1.50,
        real_net_cost: 1.35,
        suggested_price: 3.99,
        projected_margin: calculateMargin(1.35, 3.99),
        historical_avg_cost: 1.40,
        approval_status: 'pending_human',
        approved_price: null,
        approved_by: null,
        approved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

// =============================================================================
// HOOK: usePendingApprovals
// =============================================================================
// In the future, replace MOCK_APPROVALS with:
//   const { data } = useQuery({
//     queryKey: ['pricing-approvals', 'pending'],
//     queryFn: () => supabase
//       .from('pricing_approvals')
//       .select('*, product:products(*), supplier:suppliers(*)')
//       .eq('approval_status', 'pending_human')
//       .order('created_at', { ascending: false })
//   });
// =============================================================================

export function usePendingApprovals() {
    const [approvals, setApprovals] = useState<PricingApproval[]>(MOCK_APPROVALS);
    const [isLoading, setIsLoading] = useState(false);

    const pendingApprovals = approvals.filter(
        (a) => a.approval_status === 'pending_human'
    );

    const approvedApprovals = approvals.filter(
        (a) => a.approval_status === 'approved'
    );

    /**
     * Approve a pricing suggestion (with optional price override).
     * In the future, this will call:
     *   supabase.from('pricing_approvals').update({ ... }).eq('id', id)
     *   supabase.from('products').update({ price: finalPrice }).eq('id', productId)
     */
    const approvePrice = useCallback(
        async (id: string, finalPrice: number) => {
            // Simulate async operation (future: Supabase mutation)
            setIsLoading(true);

            // Simulate network delay
            await new Promise((resolve) => setTimeout(resolve, 300));

            setApprovals((prev) =>
                prev.map((a) =>
                    a.id === id
                        ? {
                            ...a,
                            approval_status: 'approved' as const,
                            approved_price: finalPrice,
                            approved_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        }
                        : a
                )
            );

            setIsLoading(false);

            toast.success('✅ Preço atualizado com sucesso!', {
                description: `Novo preço: R$ ${finalPrice.toFixed(2).replace('.', ',')}`,
                duration: 3000,
            });
        },
        []
    );

    /**
     * Update the suggested price for a pending approval (before approving).
     * This recalculates the margin in real-time on the frontend.
     */
    const updateSuggestedPrice = useCallback(
        (id: string, newPrice: number) => {
            setApprovals((prev) =>
                prev.map((a) =>
                    a.id === id
                        ? {
                            ...a,
                            suggested_price: newPrice,
                            projected_margin: calculateMargin(a.real_net_cost, newPrice),
                            updated_at: new Date().toISOString(),
                        }
                        : a
                )
            );
        },
        []
    );

    /**
     * Refresh approvals from the server.
     * In the future: queryClient.invalidateQueries(['pricing-approvals'])
     */
    const refresh = useCallback(async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        setIsLoading(false);
    }, []);

    return {
        approvals,
        pendingApprovals,
        approvedApprovals,
        isLoading,
        approvePrice,
        updateSuggestedPrice,
        refresh,
    };
}
