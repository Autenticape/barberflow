export default function HomePage() {
  return (
    <div style={S.page}>
      <div style={S.brandMark}>✂</div>
      <h1 style={S.title}>BarberFlow</h1>
      <p style={S.subtitle}>
        Agenda, financeiro e estoque para sua barbearia, em um só lugar.
        <br />14 dias grátis, sem cartão de crédito.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
        <a href="/cadastro" style={S.primaryBtn}>Criar minha barbearia</a>
        <a href="/login" style={S.secondaryBtn}>Já tenho conta</a>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    background: "#fcfaf5", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", textAlign: "center", padding: 20,
  },
  brandMark: { width: 56, height: 56, borderRadius: 16, background: "#1c1b18", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 16 },
  title: { fontSize: 30, fontWeight: 800, margin: 0, color: "#1c1b18" },
  subtitle: { fontSize: 15, color: "#7a7669", marginTop: 10, lineHeight: 1.6, maxWidth: 380 },
  primaryBtn: { padding: "12px 22px", borderRadius: 10, background: "#1c1b18", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" },
  secondaryBtn: { padding: "12px 22px", borderRadius: 10, border: "1px solid #e4e1d6", color: "#5f5e5a", fontSize: 14, fontWeight: 600, textDecoration: "none" },
};
