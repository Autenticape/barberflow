"use client";

import { useState } from "react";
import { fmtDatePT, fmtMoney } from "../../lib/utils";

const STATUS_LABELS = {
  trialing: { label: "Em teste", color: "#185FA5", bg: "#E8F1FB" },
  active: { label: "Ativo (pago)", color: "#0F6E56", bg: "#E6F4EF" },
  suspended: { label: "Suspenso", color: "#993C1D", bg: "#FCE9E1" },
  canceled: { label: "Cancelado", color: "#7a7669", bg: "#f1efe6" },
  past_due: { label: "Pagamento pendente", color: "#A3700A", bg: "#FAEEDA" },
};

export default function AdminShell({ orgs: initialOrgs }) {
  const [orgs, setOrgs] = useState(initialOrgs);
  const [updating, setUpdating] = useState(null);
  const [search, setSearch] = useState("");

  const updateStatus = async (orgId, status) => {
    setUpdating(orgId);
    const res = await fetch("/admin/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, status }),
    });
    if (res.ok) {
      setOrgs((prev) => prev.map((o) => (o.id === orgId ? { ...o, subscription_status: status } : o)));
    }
    setUpdating(null);
  };

  const filtered = orgs.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));
  const activeCount = orgs.filter((o) => o.subscription_status === "active").length;
  const trialCount = orgs.filter((o) => o.subscription_status === "trialing").length;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Painel BarberFlow — Admin</h1>
        <p style={{ fontSize: 13, color: "#9a9588", margin: "4px 0 0" }}>Gerencie o acesso de cada barbearia cliente</p>
      </div>

      <div style={S.statsRow}>
        <StatCard label="Barbearias cadastradas" value={orgs.length} />
        <StatCard label="Pagando (ativas)" value={activeCount} />
        <StatCard label="Em período de teste" value={trialCount} />
      </div>

      <input
        placeholder="Buscar barbearia..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...S.input, maxWidth: 280, marginBottom: 16 }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((org) => {
          const statusInfo = STATUS_LABELS[org.subscription_status] || STATUS_LABELS.trialing;
          const trialDaysLeft = org.subscription_status === "trialing"
            ? Math.ceil((new Date(org.trial_ends_at) - new Date()) / 86400000)
            : null;
          return (
            <div key={org.id} style={S.row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 14 }}>{org.name}</strong>
                  <span style={{ ...S.badge, color: statusInfo.color, background: statusInfo.bg }}>{statusInfo.label}</span>
                </div>
                <div style={{ fontSize: 12, color: "#9a9588", marginTop: 3 }}>
                  /agendar/{org.slug} · criado em {fmtDatePT(org.created_at?.slice(0, 10))}
                  {trialDaysLeft !== null && ` · trial termina em ${trialDaysLeft}d`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {org.subscription_status !== "active" && (
                  <ActionBtn onClick={() => updateStatus(org.id, "active")} loading={updating === org.id} variant="primary">
                    Ativar (pago)
                  </ActionBtn>
                )}
                {org.subscription_status !== "suspended" && (
                  <ActionBtn onClick={() => updateStatus(org.id, "suspended")} loading={updating === org.id} variant="danger">
                    Suspender
                  </ActionBtn>
                )}
                {org.subscription_status !== "trialing" && (
                  <ActionBtn onClick={() => updateStatus(org.id, "trialing")} loading={updating === org.id} variant="secondary">
                    Voltar p/ teste
                  </ActionBtn>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#b0aca0", fontSize: 13 }}>Nenhuma barbearia encontrada.</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ece9de", borderRadius: 12, padding: "14px 18px", flex: 1 }}>
      <div style={{ fontSize: 12, color: "#9a9588" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function ActionBtn({ children, onClick, loading, variant }) {
  const styles = {
    primary: { background: "#1c1b18", color: "#fff", border: "none" },
    secondary: { background: "#fff", color: "#5f5e5a", border: "1px solid #e4e1d6" },
    danger: { background: "#fff", color: "#993C1D", border: "1px solid #f0997b" },
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{ ...styles[variant], padding: "7px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: loading ? "wait" : "pointer" }}
    >
      {loading ? "..." : children}
    </button>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#fcfaf5", padding: "28px 24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 900, margin: "0 auto" },
  header: { marginBottom: 20 },
  statsRow: { display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #ece9de", borderRadius: 10, padding: "14px 16px", flexWrap: "wrap" },
  badge: { fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99 },
  input: { padding: "9px 12px", borderRadius: 8, border: "1px solid #e4e1d6", fontSize: 13.5, width: "100%", boxSizing: "border-box" },
};
