import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Valid product categories whitelist
const VALID_CATEGORIES = ['frutas', 'verduras', 'legumes', 'temperos', 'outros', 'produce'];

// Sanitize product name - only allow alphanumeric, spaces, hyphens, and common accented chars
function sanitizeProductName(name: string): string {
  return name
    .slice(0, 100) // Max 100 characters
    .replace(/[^a-zA-ZÀ-ÿ0-9\s\-]/g, '') // Only alphanumeric, accents, spaces, hyphens
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== AUTHENTICATION ==========
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth context
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // ========== AUTHORIZATION - Check if user is manager (admin or moderator) ==========
    const { data: roles, error: rolesError } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'moderator']);

    if (rolesError || !roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Only managers can generate product images" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== INPUT VALIDATION ==========
    const { productName, productId, category } = await req.json();

    // Validate productId is a valid UUID
    if (!productId || typeof productId !== 'string' || !UUID_REGEX.test(productId)) {
      return new Response(
        JSON.stringify({ error: "Invalid productId - must be a valid UUID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and sanitize productName
    if (!productName || typeof productName !== 'string') {
      return new Response(
        JSON.stringify({ error: "productName is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedName = sanitizeProductName(productName);
    if (!sanitizedName || sanitizedName.length < 2) {
      return new Response(
        JSON.stringify({ error: "productName must contain at least 2 valid characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate category against whitelist
    const sanitizedCategory = category && typeof category === 'string' && VALID_CATEGORIES.includes(category.toLowerCase())
      ? category.toLowerCase()
      : 'produce';

    // Verify the product exists before generating image
    const { data: product, error: productError } = await supabaseAuth
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Generate image using Gemini via Lovable AI Gateway with structured prompt
    const prompt = [
      'Create a simple, clean illustration of a grocery product on a white background.',
      `Product name: ${sanitizedName}`,
      `Category: ${sanitizedCategory}`,
      'Style: flat design, minimalist, vibrant colors.',
      'The item should be centered and fill 80% of the frame.',
      'Requirements: No text, no shadows, no decorations, single item only.',
      'Professional quality illustration suitable for a grocery store product catalog.'
    ].join('\n');

    console.log("Generating image for product:", productId, "by user:", userId);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    // Extract the base64 image from the response
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      throw new Error("No image generated");
    }

    // Extract base64 data (remove data:image/png;base64, prefix if present)
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const fileName = `${productId}-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;
    console.log("Image uploaded:", imageUrl);

    // Update the product with the new image URL
    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', productId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error(`Product update failed: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl,
        message: "Image generated and saved successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
