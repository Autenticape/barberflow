"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase-browser";
import { slugify } from "../../lib/utils";

export default function CadastroPage() {
  const router = useRouter();
  const supabase = createClient();
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!shopName.trim() || !email.trim() || password.length < 6) {
      setError("Preencha o nome da barbearia, e-mail, e uma senha com pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(traduzErro(authError.message));
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setError("Confirme seu e-mail para concluir o cadastro (verifique sua caixa de entrada).");
      setLoading(false);
      return;
    }

    const baseSlug = slugify(shopName);
    const slug = baseSlug + "-" + Math.random().toString(36).slice(2, 6);

    const { error: orgError } = await supabase.from("organizations").insert({
      name: shopName.trim(),
      slug,
      owner_user_id: userId,
    });

    if (orgError) {
      setError("Erro ao criar sua barbearia: " + orgError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <h1 style={S.title}>Criar conta no BarberFlow</h1>
        <p style={S.subtitle}>14 dias grátis para testar. Sem cartão de crédito.</p>

        <form onSubmit={handleSubmit}>
          <Field label="Nome da barbearia">
            <input style={S.input} value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Ex: Barbearia do Carlos" />
          </Field>
          <Field label="Seu e-mail">
            <input type="email" style={S.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
          </Field>
          <Field label="Senha">
            <input type="password" style={S.input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" />
          </Field>

          {error && <div style={S.error}>{error}</div>}

          <button type="submit" disabled={loading} style={S.button}>
            {loading ? "Criando..." : "Criar minha barbearia"}
          </button>
        </form>

        <p style={S.footer}>
          Já tem conta? <a href="/login" style={S.link}>Entrar</a>
        </p>
      </div>
    </div>
  );
}

function traduzErro(msg) {
  if (msg.includes("already registered")) return "Este e-mail já está cadastrado. Tente fazer login.";
  if (msg.includes("Password")) return "Senha muito curta ou inválida.";
  return msg;
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: "#5f5e5a", marginBottom: 5, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}

const S = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fcfaf5", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: 20 },
  card: { background: "#fff", borderRadius: 16, padding: "32px 28px", width: 380, maxWidth: "100%", border: "1px solid #ece9de" },
  title: { fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: "#1c1b18" },
  subtitle: { fontSize: 13, color: "#9a9588", margin: "0 0 24px" },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e4e1d6", fontSize: 14, boxSizing: "border-box" },
  button: { width: "100%", padding: "11px", borderRadius: 8, border: "none", background: "#1c1b18", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8 },
  error: { background: "#FCEBEB", color: "#791F1F", fontSize: 13, padding: "8px 12px", borderRadius: 8, marginBottom: 12 },
  footer: { textAlign: "center", fontSize: 13, color: "#9a9588", marginTop: 18 },
  link: { color: "#1c1b18", fontWeight: 600 },
};
