// =============================================================================
// AI PRICING SERVICE — API Wrapper (Zero-Trust Architecture)
// =============================================================================
import { supabase } from '@/integrations/supabase/client';

export interface AiPriceSuggestionResponse {
    suggestedPrice: number;
    projectedMargin: number;
    reasoning: string;
}

/**
 * Requests an AI-generated price suggestion for a product.
 * Calls the Supabase Edge Function 'ai-pricing-advisor'.
 *
 * @param productId - The Supabase product ID
 * @param realCost - The current purchase cost
 * @returns Promise<AiPriceSuggestionResponse>
 */
export async function getAiPriceSuggestion(
    productId: string,
    realCost: number
): Promise<AiPriceSuggestionResponse> {
    try {
        const { data, error } = await supabase.functions.invoke('ai-pricing-advisor', {
            body: { productId, realCost }
        });

        if (error) {
            console.error('Error invoking ai-pricing-advisor:', error);
            throw new Error(error.message || 'Erro na comunicação com a IA');
        }

        return data as AiPriceSuggestionResponse;
    } catch (err) {
        console.error('Failed to get AI price suggestion:', err);
        throw err;
    }
}
