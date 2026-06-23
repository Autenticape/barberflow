import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase-server";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_user_id", user.id)
    .single();

  if (!org) redirect("/cadastro");

  const trialExpired =
    org.subscription_status === "trialing" && new Date(org.trial_ends_at) < new Date();
  const blocked =
    org.subscription_status === "suspended" ||
    org.subscription_status === "canceled" ||
    org.subscription_status === "past_due" ||
    trialExpired;

  if (blocked) {
    return (
      <div style={S.blockedWrap}>
        <div style={S.blockedCard}>
          <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Acesso temporariamente bloqueado</h2>
          <p style={{ color: "#7a7669", fontSize: 14, lineHeight: 1.6 }}>
            {trialExpired
              ? "Seu período de teste grátis terminou. Fale com o suporte para liberar seu acesso."
              : "Identificamos uma pendência na sua assinatura. Fale com o suporte para regularizar."}
          </p>
          <p style={{ fontSize: 13, color: "#9a9588", marginTop: 16 }}>
            Seus dados estão salvos e seguros — nada foi perdido.
          </p>
        </div>
      </div>
    );
  }

  return <DashboardShell org={org}>{children}</DashboardShell>;
}

const S = {
  blockedWrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fcfaf5", padding: 20, fontFamily: "sans-serif" },
  blockedCard: { background: "#fff", border: "1px solid #ece9de", borderRadius: 14, padding: 28, maxWidth: 420 },
};
