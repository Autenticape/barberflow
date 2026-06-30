import { createClient } from "../../../lib/supabase-server";
import BookingForm from "./BookingForm";
export default async function BookingPage({ params }) {
  const supabase = createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, logo_url, cover_url, primary_color, description, address, phone")
    .eq("slug", params.slug)
    .single();
  if (!org) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <p style={{ color: "#9a9588" }}>Barbearia não encontrada.</p>
      </div>
    );
  }
  const [{ data: professionals }, { data: services }] = await Promise.all([
    supabase.from("professionals").select("*").eq("org_id", org.id).eq("active", true),
    supabase.from("services").select("*").eq("org_id", org.id).eq("active", true),
  ]);
  return <BookingForm org={org} professionals={professionals || []} services={services || []} />;
}
