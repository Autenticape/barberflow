"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <h1 style={S.title}>Entrar no BarberFlow</h1>
        <form onSubmit={handleSubmit}>
          <Field label="E-mail">
            <input type="email" style={S.input} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Senha">
            <input type="password" style={S.input} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <div style={S.error}>{error}</div>}
          <button type="submit" disabled={loading} style={S.button}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p style={S.footer}>
          Ainda não tem conta? <a href="/cadastro" style={S.link}>Criar barbearia</a>
        </p>
      </div>
    </div>
  );
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
  title: { fontSize: 20, fontWeight: 700, margin: "0 0 20px", color: "#1c1b18" },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e4e1d6", fontSize: 14, boxSizing: "border-box" },
  button: { width: "100%", padding: "11px", borderRadius: 8, border: "none", background: "#1c1b18", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8 },
  error: { background: "#FCEBEB", color: "#791F1F", fontSize: 13, padding: "8px 12px", borderRadius: 8, marginBottom: 12 },
  footer: { textAlign: "center", fontSize: 13, color: "#9a9588", marginTop: 18 },
  link: { color: "#1c1b18", fontWeight: 600 },
};
