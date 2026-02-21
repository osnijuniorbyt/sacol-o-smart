import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { productId, realCost } = await req.json()

        // Mock processing delay (1.5s)
        await new Promise(resolve => setTimeout(resolve, 1500))

        const suggestedPrice = realCost * 1.45
        const projectedMargin = 45

        const responseData = {
            suggestedPrice,
            projectedMargin,
            reasoning: "Margem projetada com base no risco da categoria (Simulador Airlock)."
        }

        return new Response(
            JSON.stringify(responseData),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
