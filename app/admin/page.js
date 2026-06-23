import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase-server";
import AdminShell from "./AdminShell";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <p style={{ color: "#9a9588" }}>Acesso restrito.</p>
      </div>
    );
  }

  const { data: orgs } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  return <AdminShell orgs={orgs || []} />;
}
