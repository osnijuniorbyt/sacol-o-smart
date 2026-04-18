import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = "admin@admin.com";
    const password = "admin123";

    // Tenta criar o usuário
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Administrador" },
    });

    let userId = created?.user?.id;

    // Se já existe, busca e atualiza a senha
    if (createErr && createErr.message.toLowerCase().includes("already")) {
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === email);
      if (!existing) throw new Error("Usuário existe mas não foi encontrado");
      userId = existing.id;
      await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    } else if (createErr) {
      throw createErr;
    }

    if (!userId) throw new Error("ID do usuário não obtido");

    // Garante perfil aprovado
    await admin.from("profiles").upsert({
      id: userId,
      full_name: "Administrador",
      is_approved: true,
      approved_at: new Date().toISOString(),
    });

    // Garante role admin
    await admin.from("user_roles").upsert(
      { user_id: userId, role: "admin" },
      { onConflict: "user_id,role" }
    );

    return new Response(
      JSON.stringify({ success: true, email, password, userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
