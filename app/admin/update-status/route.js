import { NextResponse } from "next/server";
import { createClient as createServerClient } from "../../../lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  // 1. confirma que quem está chamando é você (admin), usando a sessão normal
  const supabaseAsUser = createServerClient();
  const {
    data: { user },
  } = await supabaseAsUser.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { orgId, status } = await request.json();
  const allowed = ["trialing", "active", "suspended", "canceled", "past_due"];
  if (!orgId || !allowed.includes(status)) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  // 2. usa a service role key (acesso total, ignora RLS) só pra essa ação pontual
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabaseAdmin
    .from("organizations")
    .update({ subscription_status: status })
    .eq("id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
