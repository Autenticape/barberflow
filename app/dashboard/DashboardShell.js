"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase-browser";
import {
  uid, todayISO, fmtMoney, fmtDatePT, weekdayPT, addDays,
  timeToMin, minToTime, WEEK_LABELS, buildSlots,
} from "../../lib/utils";

export default function DashboardShell({ org, children }) {
  const router = useRouter();
  const supabase = createClient();
  const [view, setView] = useState("agenda");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [activeProf, setActiveProf] = useState("all");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [professionals, setProfessionals] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [comandas, setComandas] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [cashMovements, setCashMovements] = useState([]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    const orgId = org.id;
    const [p, c, s, pr, ap, co, wl, cm] = await Promise.all([
      supabase.from("professionals").select("*").eq("org_id", orgId).order("created_at"),
      supabase.from("clients").select("*").eq("org_id", orgId).order("name"),
      supabase.from("services").select("*").eq("org_id", orgId).order("created_at"),
      supabase.from("products").select("*").eq("org_id", orgId).order("name"),
      supabase.from("appointments").select("*").eq("org_id", orgId),
      supabase.from("comandas").select("*, comanda_items(*)").eq("org_id", orgId),
      supabase.from("waitlist").select("*").eq("org_id", orgId),
      supabase.from("cash_movements").select("*").eq("org_id", orgId),
    ]);
    setProfessionals(p.data || []);
    setClients(c.data || []);
    setServices(s.data || []);
    setProducts(pr.data || []);
    setAppointments(ap.data || []);
    setComandas(co.data || []);
    setWaitlist(wl.data || []);
    setCashMovements(cm.data || []);
    setLoading(false);
  }, [org.id, supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 760);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const ctx = {
    org, supabase, showToast, reload: loadAll,
    professionals, clients, services, products, appointments, comandas, waitlist, cashMovements,
  };

  if (loading) {
    return (
      <div style={S.loadingScreen}>
        <p style={{ color: "#8a8578", fontSize: 14 }}>Carregando {org.name}...</p>
      </div>
    );
  }

  return (
    <div style={{ ...S.app, flexDirection: isMobile ? "column" : "row" }}>
      {!isMobile && <Sidebar view={view} setView={setView} orgName={org.name} onLogout={handleLogout} />}
      <div style={{ ...S.main, paddingBottom: isMobile ? 64 : 0 }}>
        <TopBar org={org} view={view} selectedDate={selectedDate} setSelectedDate={setSelectedDate} isMobile={isMobile} onLogout={handleLogout} />
        <div style={{ ...S.content, padding: isMobile ? "16px 14px" : "24px 28px" }}>
          {view === "agenda" && (
            <AgendaView ctx={ctx} selectedDate={selectedDate} activeProf={activeProf} setActiveProf={setActiveProf} isMobile={isMobile} />
          )}
          {view === "clients" && <ClientsView ctx={ctx} />}
          {view === "finance" && <FinanceView ctx={ctx} />}
          {view === "stock" && <StockView ctx={ctx} />}
          {view === "team" && <TeamView ctx={ctx} />}
          {view === "reports" && <ReportsView ctx={ctx} />}
          {view === "waitlist" && <WaitlistView ctx={ctx} />}
          {view === "settings" && <SettingsView ctx={ctx} />}
        </div>
      </div>
      {isMobile && <BottomNav view={view} setView={setView} />}
      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}

// ---------- Sidebar / nav ----------
function Sidebar({ view, setView, orgName, onLogout }) {
  const items = [
    { id: "agenda", label: "Agenda", icon: "📅" },
    { id: "waitlist", label: "Lista de espera", icon: "⏳" },
    { id: "clients", label: "Clientes", icon: "👤" },
    { id: "finance", label: "Financeiro", icon: "💰" },
    { id: "stock", label: "Estoque", icon: "📦" },
    { id: "team", label: "Equipe", icon: "👥" },
    { id: "reports", label: "Relatórios", icon: "📊" },
    { id: "settings", label: "Ajustes", icon: "⚙️" },
  ];
  return (
    <div style={S.sidebar}>
      <div style={S.brand}>
        <div style={S.brandMark}>✂</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1c1b18" }}>{orgName}</div>
          <div style={{ fontSize: 11, color: "#9a9588" }}>BarberFlow</div>
        </div>
      </div>
      <nav style={{ marginTop: 18 }}>
        {items.map((it) => (
          <button key={it.id} onClick={() => setView(it.id)} style={{ ...S.navItem, ...(view === it.id ? S.navItemActive : {}) }}>
            <span style={{ fontSize: 16 }}>{it.icon}</span>
            {it.label}
          </button>
        ))}
      </nav>
      <button onClick={onLogout} style={{ ...S.navItem, marginTop: 20, color: "#993C1D" }}>
        <span style={{ fontSize: 16 }}>↩</span>
        Sair
      </button>
    </div>
  );
}

function BottomNav({ view, setView }) {
  const items = [
    { id: "agenda", label: "Agenda", icon: "📅" },
    { id: "waitlist", label: "Espera", icon: "⏳" },
    { id: "clients", label: "Clientes", icon: "👤" },
    { id: "finance", label: "Caixa", icon: "💰" },
    { id: "team", label: "Equipe", icon: "👥" },
  ];
  return (
    <div style={S.bottomNav}>
      {items.map((it) => (
        <button key={it.id} onClick={() => setView(it.id)} style={{ ...S.bottomNavItem, color: view === it.id ? "#1c1b18" : "#b0aca0" }}>
          <span style={{ fontSize: 18 }}>{it.icon}</span>
          <span style={{ fontSize: 10 }}>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

function TopBar({ org, view, selectedDate, setSelectedDate, isMobile, onLogout }) {
  const titles = { agenda: "Agenda", waitlist: "Lista de espera", clients: "Clientes", finance: "Financeiro", stock: "Estoque", team: "Equipe", reports: "Relatórios", settings: "Ajustes" };
  const trialDaysLeft = org.subscription_status === "trialing"
    ? Math.max(0, Math.ceil((new Date(org.trial_ends_at) - new Date()) / 86400000))
    : null;
  return (
    <div style={{ ...S.topbar, padding: isMobile ? "14px 14px" : "18px 28px", flexWrap: "wrap", gap: 10 }}>
      <div>
        <h1 style={{ fontSize: isMobile ? 17 : 19, fontWeight: 700, color: "#1c1b18", margin: 0 }}>
          {isMobile ? org.name : titles[view]}
        </h1>
        {trialDaysLeft !== null && (
          <div style={{ fontSize: 11.5, color: trialDaysLeft <= 3 ? "#993C1D" : "#9a9588", marginTop: 2 }}>
            {trialDaysLeft > 0 ? `${trialDaysLeft} dia(s) restantes no teste grátis` : "Teste grátis encerrado"}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {view === "agenda" && (
          <>
            <button style={S.iconBtn} onClick={() => setSelectedDate(addDays(selectedDate, -1))}>‹</button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={S.dateInput} />
            <button style={S.iconBtn} onClick={() => setSelectedDate(addDays(selectedDate, 1))}>›</button>
            {!isMobile && <button style={S.todayBtn} onClick={() => setSelectedDate(todayISO())}>Hoje</button>}
          </>
        )}
        {isMobile && <button style={S.todayBtn} onClick={onLogout}>Sair</button>}
      </div>
    </div>
  );
}

// ---------- Agenda ----------
function AgendaView({ ctx, selectedDate, activeProf, setActiveProf, isMobile }) {
  const { supabase, org, professionals, clients, services, appointments, showToast, reload } = ctx;
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [slotPrefill, setSlotPrefill] = useState(null);

  const profs = activeProf === "all" ? professionals : professionals.filter((p) => p.id === activeProf);
  const weekday = new Date(selectedDate + "T12:00:00").getDay();
  const dayAppts = appointments.filter((a) => a.appt_date === selectedDate);

  const openNew = (profId, time) => {
    setSlotPrefill({ profId: profId || professionals[0]?.id || "", time: time || "09:00" });
    setEditing(null);
    setShowModal(true);
  };
  const openEdit = (appt) => {
    setEditing(appt);
    setSlotPrefill(null);
    setShowModal(true);
  };

  const saveAppt = async (data) => {
    let clientId = data.clientId;
    if (clientId.startsWith("__new__:")) {
      const name = clientId.slice("__new__:".length);
      const { data: newClient, error } = await supabase
        .from("clients").insert({ org_id: org.id, name, phone: "" }).select().single();
      if (error) { showToast("Erro ao criar cliente"); return; }
      clientId = newClient.id;
    }

    const payload = {
      org_id: org.id,
      client_id: clientId,
      professional_id: data.profId,
      service_id: data.serviceId,
      appt_date: selectedDate,
      appt_time: data.time,
      deposit_paid: data.deposit,
      notes: data.notes,
    };

    if (editing) {
      await supabase.from("appointments").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("appointments").insert({ ...payload, status: "confirmado" });
    }
    await reload();
    setShowModal(false);
    showToast(editing ? "Agendamento atualizado" : "Agendamento criado");
  };

  const removeAppt = async (id) => {
    await supabase.from("appointments").delete().eq("id", id);
    await reload();
    setShowModal(false);
    showToast("Agendamento cancelado");
  };

  const markDone = async (appt) => {
    const service = services.find((s) => s.id === appt.service_id);
    await supabase.from("appointments").update({ status: "concluido" }).eq("id", appt.id);
    const { data: comanda } = await supabase.from("comandas").insert({
      org_id: org.id, client_id: appt.client_id, professional_id: appt.professional_id,
      appointment_id: appt.id, total: service?.price || 0, paid: false, comanda_date: appt.appt_date,
    }).select().single();
    if (comanda) {
      await supabase.from("comanda_items").insert({
        comanda_id: comanda.id, item_type: "service", ref_id: appt.service_id, qty: 1, unit_price: service?.price || 0,
      });
    }
    await reload();
    showToast("Atendimento concluído. Comanda aberta no Financeiro.");
  };

  if (professionals.length === 0) {
    return <EmptyState title="Cadastre sua equipe primeiro" text="Para usar a agenda, adicione pelo menos um profissional em Equipe." />;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <ProfPill active={activeProf === "all"} onClick={() => setActiveProf("all")} label="Todos" color="#5f5e5a" />
        {professionals.map((p) => (
          <ProfPill key={p.id} active={activeProf === p.id} onClick={() => setActiveProf(p.id)} label={p.name} color={p.color} />
        ))}
        {!isMobile && <div style={{ flex: 1 }} />}
        <button style={{ ...S.primaryBtn, ...(isMobile ? { width: "100%" } : {}) }} onClick={() => openNew(activeProf !== "all" ? activeProf : null, null)}>
          + Novo agendamento
        </button>
      </div>

      <div style={{ fontSize: 13, color: "#9a9588", marginBottom: 10 }}>{weekdayPT(selectedDate)}, {fmtDatePT(selectedDate)}</div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${profs.length}, 1fr)`, gap: 12 }}>
        {profs.map((prof) => {
          const hours = { start: prof.work_start?.slice(0,5), end: prof.work_end?.slice(0,5), lunchStart: prof.lunch_start?.slice(0,5), lunchEnd: prof.lunch_end?.slice(0,5) };
          const working = (prof.work_days || []).includes(weekday);
          const profAppts = dayAppts.filter((a) => a.professional_id === prof.id).sort((a, b) => a.appt_time.localeCompare(b.appt_time));
          const slots = buildSlots(hours);
          return (
            <div key={prof.id} style={S.dayCol}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: prof.color }} />
                <strong style={{ fontSize: 14 }}>{prof.name}</strong>
              </div>
              {!working ? (
                <div style={{ fontSize: 13, color: "#b0aca0", padding: "20px 0", textAlign: "center" }}>Folga hoje</div>
              ) : (
                slots.map((slot) => {
                  const appt = profAppts.find((a) => a.appt_time?.slice(0, 5) === slot);
                  if (appt) {
                    const client = clients.find((c) => c.id === appt.client_id);
                    const service = services.find((s) => s.id === appt.service_id);
                    return (
                      <div key={slot} onClick={() => openEdit(appt)} style={{ ...S.apptBlock, borderLeft: `3px solid ${prof.color}`, opacity: appt.status === "concluido" ? 0.55 : 1 }}>
                        <div style={{ fontSize: 12, color: "#9a9588" }}>{slot}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{client?.name || "Cliente"}</div>
                        <div style={{ fontSize: 12, color: "#7a7669" }}>{service?.name}</div>
                        {appt.status === "concluido" && <div style={S.doneTag}>concluído</div>}
                        {appt.deposit_paid && <div style={S.depositTag}>sinal pago</div>}
                      </div>
                    );
                  }
                  return (
                    <div key={slot} onClick={() => openNew(prof.id, slot)} style={S.emptySlot}>
                      <span style={{ fontSize: 11, color: "#c7c3b6" }}>{slot}</span>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <ApptModal
          professionals={professionals} clients={clients} services={services}
          editing={editing} prefill={slotPrefill}
          onClose={() => setShowModal(false)} onSave={saveAppt}
          onDelete={editing ? () => removeAppt(editing.id) : null}
          onMarkDone={editing && editing.status !== "concluido" ? () => markDone(editing) : null}
        />
      )}
    </div>
  );
}

function ProfPill({ active, onClick, label, color }) {
  return (
    <button onClick={onClick} style={{ ...S.pill, background: active ? color + "22" : "transparent", borderColor: active ? color : "#e4e1d6", color: active ? "#1c1b18" : "#7a7669", fontWeight: active ? 700 : 500 }}>
      {label}
    </button>
  );
}

function ApptModal({ professionals, clients, services, editing, prefill, onClose, onSave, onDelete, onMarkDone }) {
  const [clientId, setClientId] = useState(editing ? editing.client_id : "");
  const [newClientName, setNewClientName] = useState("");
  const [profId, setProfId] = useState(editing ? editing.professional_id : prefill ? prefill.profId : professionals[0]?.id || "");
  const [serviceId, setServiceId] = useState(editing ? editing.service_id : services[0]?.id || "");
  const [time, setTime] = useState(editing ? editing.appt_time?.slice(0, 5) : prefill ? prefill.time : "09:00");
  const [deposit, setDeposit] = useState(editing ? !!editing.deposit_paid : false);
  const [notes, setNotes] = useState(editing ? editing.notes || "" : "");

  const handleSave = () => {
    let finalClientId = clientId;
    if (!finalClientId && newClientName.trim()) finalClientId = "__new__:" + newClientName.trim();
    if (!finalClientId || !profId || !serviceId || !time) return;
    onSave({ clientId: finalClientId, profId, serviceId, time, deposit, notes });
  };

  return (
    <Modal onClose={onClose} title={editing ? "Editar agendamento" : "Novo agendamento"}>
      <Field label="Cliente">
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={S.select}>
          <option value="">Selecione...</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {!clientId && (
          <input placeholder="ou digite o nome de um cliente novo" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} style={{ ...S.input, marginTop: 6 }} />
        )}
      </Field>
      <Field label="Profissional">
        <select value={profId} onChange={(e) => setProfId(e.target.value)} style={S.select}>
          {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Serviço">
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={S.select}>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name} — {fmtMoney(s.price)} ({s.duration_minutes}min)</option>)}
        </select>
      </Field>
      <Field label="Horário"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={S.input} /></Field>
      <Field label="Observações"><input value={notes} onChange={(e) => setNotes(e.target.value)} style={S.input} /></Field>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#5f5e5a", margin: "10px 0 4px" }}>
        <input type="checkbox" checked={deposit} onChange={(e) => setDeposit(e.target.checked)} />
        Cliente pagou sinal (reduz falta)
      </label>
      <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
        <button style={S.primaryBtn} onClick={handleSave}>Salvar</button>
        {onMarkDone && <button style={S.secondaryBtn} onClick={onMarkDone}>Concluir atendimento</button>}
        {onDelete && <button style={S.dangerBtn} onClick={onDelete}>Cancelar agendamento</button>}
      </div>
    </Modal>
  );
}

// ---------- Waitlist ----------
function WaitlistView({ ctx }) {
  const { supabase, org, services, waitlist, showToast, reload } = ctx;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id || "");

  const add = async () => {
    if (!name.trim()) return;
    await supabase.from("waitlist").insert({ org_id: org.id, client_name: name.trim(), phone, service_id: serviceId || null });
    setName(""); setPhone("");
    await reload();
    showToast("Adicionado à lista de espera");
  };

  const remove = async (id) => {
    await supabase.from("waitlist").delete().eq("id", id);
    await reload();
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: "#7a7669", marginBottom: 16, maxWidth: 520 }}>
        Quando não houver horário disponível, adicione o cliente aqui. Assim que vagar um horário, avise quem está na lista — sem perder a venda.
      </p>
      <div style={{ ...S.card, marginBottom: 20, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Field label="Nome" inline><input value={name} onChange={(e) => setName(e.target.value)} style={S.input} /></Field>
        <Field label="Telefone" inline><input value={phone} onChange={(e) => setPhone(e.target.value)} style={S.input} /></Field>
        <Field label="Serviço desejado" inline>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={S.select}>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <button style={S.primaryBtn} onClick={add}>Adicionar</button>
      </div>
      {waitlist.length === 0 ? (
        <EmptyState title="Lista vazia" text="Ninguém está esperando horário no momento." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {waitlist.map((w) => {
            const service = services.find((s) => s.id === w.service_id);
            return (
              <div key={w.id} style={S.listRow}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{w.client_name}</div>
                  <div style={{ fontSize: 12, color: "#9a9588" }}>{service?.name} {w.phone && `· ${w.phone}`}</div>
                </div>
                <button style={S.dangerBtn} onClick={() => remove(w.id)}>Remover</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Clients ----------
function ClientsView({ ctx }) {
  const { supabase, org, clients, appointments, services, showToast, reload } = ctx;
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const save = async (data) => {
    if (editing) await supabase.from("clients").update(data).eq("id", editing.id);
    else await supabase.from("clients").insert({ org_id: org.id, ...data });
    await reload();
    setShowModal(false);
    showToast(editing ? "Cliente atualizado" : "Cliente cadastrado");
  };

  const remove = async (id) => {
    await supabase.from("clients").delete().eq("id", id);
    await reload();
    setShowModal(false);
  };

  const history = (clientId) => appointments.filter((a) => a.client_id === clientId).sort((a, b) => (a.appt_date < b.appt_date ? 1 : -1));

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...S.input, maxWidth: 280 }} />
        <div style={{ flex: 1 }} />
        <button style={S.primaryBtn} onClick={() => { setEditing(null); setShowModal(true); }}>+ Novo cliente</button>
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Nenhum cliente" text="Cadastre seu primeiro cliente para começar." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((c) => (
            <div key={c.id} style={S.listRow} onClick={() => { setEditing(c); setShowModal(true); }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "#9a9588" }}>{c.phone || "sem telefone"} · {history(c.id).length} atendimentos</div>
              </div>
              <span style={{ color: "#c7c3b6" }}>›</span>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title={editing ? "Editar cliente" : "Novo cliente"}>
          <ClientForm editing={editing} onSave={save} onDelete={editing ? () => remove(editing.id) : null} />
          {editing && (
            <div style={{ marginTop: 16, borderTop: "1px solid #ece9de", paddingTop: 12 }}>
              <div style={{ fontSize: 12, color: "#9a9588", marginBottom: 6, fontWeight: 600 }}>HISTÓRICO</div>
              {history(editing.id).length === 0 ? <div style={{ fontSize: 13, color: "#b0aca0" }}>Sem atendimentos ainda</div> :
                history(editing.id).slice(0, 6).map((a) => {
                  const service = services.find((s) => s.id === a.service_id);
                  return <div key={a.id} style={{ fontSize: 13, color: "#5f5e5a", padding: "4px 0" }}>{fmtDatePT(a.appt_date)} — {service?.name} ({a.status})</div>;
                })}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function ClientForm({ editing, onSave, onDelete }) {
  const [name, setName] = useState(editing?.name || "");
  const [phone, setPhone] = useState(editing?.phone || "");
  const [notes, setNotes] = useState(editing?.notes || "");
  return (
    <div>
      <Field label="Nome"><input style={S.input} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Telefone"><input style={S.input} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      <Field label="Preferências / observações"><textarea style={{ ...S.input, minHeight: 60 }} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button style={S.primaryBtn} onClick={() => name.trim() && onSave({ name: name.trim(), phone, notes })}>Salvar</button>
        {onDelete && <button style={S.dangerBtn} onClick={onDelete}>Excluir</button>}
      </div>
    </div>
  );
}

// ---------- Finance ----------
function FinanceView({ ctx }) {
  const { supabase, org, comandas, services, products, cashMovements, showToast, reload } = ctx;
  const [tab, setTab] = useState("comandas");

  const openComandas = comandas.filter((c) => !c.paid);
  const paidToday = comandas.filter((c) => c.paid && c.comanda_date === todayISO());
  const totalToday = paidToday.reduce((sum, c) => sum + Number(c.total), 0);
  const manualToday = cashMovements.filter((m) => m.movement_date === todayISO());
  const manualTotal = manualToday.reduce((s, m) => s + (m.movement_type === "entrada" ? Number(m.amount) : -Number(m.amount)), 0);

  const closeComanda = async (comandaId, paymentMethod) => {
    await supabase.from("comandas").update({ paid: true, payment_method: paymentMethod }).eq("id", comandaId);
    await reload();
    showToast("Comanda fechada");
  };

  const addItemToComanda = async (comanda, item) => {
    const price = item.type === "service" ? services.find((s) => s.id === item.refId)?.price : products.find((p) => p.id === item.refId)?.price;
    await supabase.from("comanda_items").insert({ comanda_id: comanda.id, item_type: item.type, ref_id: item.refId, qty: 1, unit_price: price || 0 });
    const newTotal = Number(comanda.total) + Number(price || 0);
    await supabase.from("comandas").update({ total: newTotal }).eq("id", comanda.id);
    if (item.type === "product") {
      const prod = products.find((p) => p.id === item.refId);
      if (prod) await supabase.from("products").update({ stock: Math.max(0, prod.stock - 1) }).eq("id", prod.id);
    }
    await reload();
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Faturado hoje" value={fmtMoney(totalToday + manualTotal)} />
        <StatCard label="Comandas em aberto" value={openComandas.length} />
        <StatCard label="Atendimentos hoje" value={paidToday.length} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <TabBtn active={tab === "comandas"} onClick={() => setTab("comandas")} label="Comandas" />
        <TabBtn active={tab === "caixa"} onClick={() => setTab("caixa")} label="Caixa manual" />
      </div>
      {tab === "comandas" && (
        openComandas.length === 0 ? (
          <EmptyState title="Nenhuma comanda em aberto" text="Comandas aparecem aqui quando você conclui um atendimento na Agenda." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {openComandas.map((c) => <ComandaCard key={c.id} comanda={c} ctx={ctx} onClose={closeComanda} onAddItem={addItemToComanda} />)}
          </div>
        )
      )}
      {tab === "caixa" && <CashManualView ctx={ctx} />}
    </div>
  );
}

function ComandaCard({ comanda, ctx, onClose, onAddItem }) {
  const { clients, professionals, services, products } = ctx;
  const client = clients.find((c) => c.id === comanda.client_id);
  const prof = professionals.find((p) => p.id === comanda.professional_id);
  const [addingProduct, setAddingProduct] = useState("");
  const items = comanda.comanda_items || [];

  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 700 }}>{client?.name || "Cliente"}</div>
          <div style={{ fontSize: 12, color: "#9a9588" }}>com {prof?.name}</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{fmtMoney(comanda.total)}</div>
      </div>
      <div style={{ margin: "10px 0", fontSize: 13, color: "#5f5e5a" }}>
        {items.map((it, idx) => {
          const ref = it.item_type === "service" ? services.find((s) => s.id === it.ref_id) : products.find((p) => p.id === it.ref_id);
          return <div key={idx}>• {ref?.name} {it.qty > 1 ? `x${it.qty}` : ""}</div>;
        })}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
        <select value={addingProduct} onChange={(e) => setAddingProduct(e.target.value)} style={{ ...S.select, fontSize: 12 }}>
          <option value="">+ adicionar produto</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {fmtMoney(p.price)}</option>)}
        </select>
        <button style={S.secondaryBtn} onClick={() => { if (!addingProduct) return; onAddItem(comanda, { type: "product", refId: addingProduct }); setAddingProduct(""); }}>Adicionar</button>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button style={S.primaryBtn} onClick={() => onClose(comanda.id, "pix")}>Receber Pix</button>
        <button style={S.secondaryBtn} onClick={() => onClose(comanda.id, "dinheiro")}>Dinheiro</button>
        <button style={S.secondaryBtn} onClick={() => onClose(comanda.id, "cartao")}>Cartão</button>
      </div>
    </div>
  );
}

function CashManualView({ ctx }) {
  const { supabase, org, cashMovements, showToast, reload } = ctx;
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("saida");

  const add = async () => {
    const val = parseFloat(amount.replace(",", "."));
    if (!desc.trim() || !val) return;
    await supabase.from("cash_movements").insert({ org_id: org.id, description: desc.trim(), amount: val, movement_type: type });
    setDesc(""); setAmount("");
    await reload();
    showToast("Lançamento registrado");
  };

  const todayMoves = cashMovements.filter((m) => m.movement_date === todayISO());

  return (
    <div>
      <div style={{ ...S.card, display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
        <Field label="Descrição" inline><input style={S.input} value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
        <Field label="Valor" inline><input style={S.input} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" /></Field>
        <Field label="Tipo" inline>
          <select style={S.select} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="saida">Saída</option>
            <option value="entrada">Entrada</option>
          </select>
        </Field>
        <button style={S.primaryBtn} onClick={add}>Lançar</button>
      </div>
      {todayMoves.length === 0 ? <EmptyState title="Nenhum lançamento manual hoje" text="Use isso para registrar despesas ou entradas fora das comandas." /> :
        todayMoves.map((m) => (
          <div key={m.id} style={S.listRow}>
            <div>{m.description}</div>
            <div style={{ color: m.movement_type === "entrada" ? "#0F6E56" : "#993C1D", fontWeight: 600 }}>{m.movement_type === "entrada" ? "+" : "-"}{fmtMoney(m.amount)}</div>
          </div>
        ))}
    </div>
  );
}

// ---------- Stock ----------
function StockView({ ctx }) {
  const { supabase, org, products, showToast, reload } = ctx;
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const save = async (data) => {
    if (editing) await supabase.from("products").update(data).eq("id", editing.id);
    else await supabase.from("products").insert({ org_id: org.id, ...data });
    await reload();
    setShowModal(false);
    showToast(editing ? "Produto atualizado" : "Produto cadastrado");
  };

  const remove = async (id) => { await supabase.from("products").delete().eq("id", id); await reload(); setShowModal(false); };
  const adjustStock = async (p, delta) => { await supabase.from("products").update({ stock: Math.max(0, p.stock + delta) }).eq("id", p.id); await reload(); };

  const lowStock = products.filter((p) => p.stock <= p.min_stock);

  return (
    <div>
      {lowStock.length > 0 && <div style={S.alertBox}>⚠ {lowStock.length} produto(s) com estoque baixo: {lowStock.map((p) => p.name).join(", ")}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button style={S.primaryBtn} onClick={() => { setEditing(null); setShowModal(true); }}>+ Novo produto</button>
      </div>
      {products.length === 0 ? <EmptyState title="Nenhum produto" text="Cadastre produtos para controlar o estoque da barbearia." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {products.map((p) => (
            <div key={p.id} style={S.listRow}>
              <div style={{ cursor: "pointer", flex: 1 }} onClick={() => { setEditing(p); setShowModal(true); }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: p.stock <= p.min_stock ? "#993C1D" : "#9a9588" }}>{p.stock} em estoque · {fmtMoney(p.price)}</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button style={S.iconBtn} onClick={() => adjustStock(p, -1)}>−</button>
                <button style={S.iconBtn} onClick={() => adjustStock(p, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title={editing ? "Editar produto" : "Novo produto"}>
          <ProductForm editing={editing} onSave={save} onDelete={editing ? () => remove(editing.id) : null} />
        </Modal>
      )}
    </div>
  );
}

function ProductForm({ editing, onSave, onDelete }) {
  const [name, setName] = useState(editing?.name || "");
  const [stock, setStock] = useState(editing?.stock ?? 0);
  const [minStock, setMinStock] = useState(editing?.min_stock ?? 2);
  const [price, setPrice] = useState(editing?.price ?? 0);
  return (
    <div>
      <Field label="Nome"><input style={S.input} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Quantidade em estoque"><input type="number" style={S.input} value={stock} onChange={(e) => setStock(Number(e.target.value))} /></Field>
      <Field label="Alertar quando estoque chegar em"><input type="number" style={S.input} value={minStock} onChange={(e) => setMinStock(Number(e.target.value))} /></Field>
      <Field label="Preço de venda"><input type="number" style={S.input} value={price} onChange={(e) => setPrice(Number(e.target.value))} /></Field>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button style={S.primaryBtn} onClick={() => name.trim() && onSave({ name: name.trim(), stock, min_stock: minStock, price })}>Salvar</button>
        {onDelete && <button style={S.dangerBtn} onClick={onDelete}>Excluir</button>}
      </div>
    </div>
  );
}

// ---------- Team ----------
function TeamView({ ctx }) {
  const { supabase, org, professionals, showToast, reload } = ctx;
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState("profs");

  const save = async (data) => {
    if (editing) await supabase.from("professionals").update(data).eq("id", editing.id);
    else await supabase.from("professionals").insert({ org_id: org.id, ...data });
    await reload();
    setShowModal(false);
    showToast(editing ? "Profissional atualizado" : "Profissional cadastrado");
  };
  const remove = async (id) => { await supabase.from("professionals").delete().eq("id", id); await reload(); setShowModal(false); };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <TabBtn active={tab === "profs"} onClick={() => setTab("profs")} label="Profissionais" />
        <TabBtn active={tab === "services"} onClick={() => setTab("services")} label="Serviços" />
      </div>
      {tab === "profs" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button style={S.primaryBtn} onClick={() => { setEditing(null); setShowModal(true); }}>+ Novo profissional</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {professionals.map((p) => (
              <div key={p.id} style={S.listRow} onClick={() => { setEditing(p); setShowModal(true); }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: p.color }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#9a9588" }}>
                      {p.work_start?.slice(0,5)}–{p.work_end?.slice(0,5)} · {(p.work_days || []).map((d) => WEEK_LABELS[d]).join(", ")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {showModal && (
            <Modal onClose={() => setShowModal(false)} title={editing ? "Editar profissional" : "Novo profissional"}>
              <ProfForm editing={editing} onSave={save} onDelete={editing ? () => remove(editing.id) : null} />
            </Modal>
          )}
        </div>
      )}
      {tab === "services" && <ServicesView ctx={ctx} />}
    </div>
  );
}

function ProfForm({ editing, onSave, onDelete }) {
  const [name, setName] = useState(editing?.name || "");
  const [color, setColor] = useState(editing?.color || "#1D9E75");
  const [start, setStart] = useState(editing?.work_start?.slice(0,5) || "09:00");
  const [end, setEnd] = useState(editing?.work_end?.slice(0,5) || "19:00");
  const [lunchStart, setLunchStart] = useState(editing?.lunch_start?.slice(0,5) || "12:00");
  const [lunchEnd, setLunchEnd] = useState(editing?.lunch_end?.slice(0,5) || "13:00");
  const [workDays, setWorkDays] = useState(editing?.work_days || [1, 2, 3, 4, 5, 6]);

  const toggleDay = (d) => setWorkDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  const colors = ["#1D9E75", "#378ADD", "#D85A30", "#D4537E", "#7F77DD", "#BA7517"];

  return (
    <div>
      <Field label="Nome"><input style={S.input} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Cor na agenda">
        <div style={{ display: "flex", gap: 6 }}>
          {colors.map((c) => <div key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: 99, background: c, cursor: "pointer", border: color === c ? "2px solid #1c1b18" : "2px solid transparent" }} />)}
        </div>
      </Field>
      <Field label="Dias de trabalho">
        <div style={{ display: "flex", gap: 4 }}>
          {WEEK_LABELS.map((label, idx) => (
            <button key={idx} onClick={() => toggleDay(idx)} style={{ ...S.dayToggle, background: workDays.includes(idx) ? "#1c1b18" : "transparent", color: workDays.includes(idx) ? "#fff" : "#9a9588" }}>{label}</button>
          ))}
        </div>
      </Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Field label="Início" inline><input type="time" style={S.input} value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="Fim" inline><input type="time" style={S.input} value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Field label="Almoço início" inline><input type="time" style={S.input} value={lunchStart} onChange={(e) => setLunchStart(e.target.value)} /></Field>
        <Field label="Almoço fim" inline><input type="time" style={S.input} value={lunchEnd} onChange={(e) => setLunchEnd(e.target.value)} /></Field>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button style={S.primaryBtn} onClick={() => name.trim() && onSave({ name: name.trim(), color, work_start: start, work_end: end, lunch_start: lunchStart, lunch_end: lunchEnd, work_days: workDays })}>Salvar</button>
        {onDelete && <button style={S.dangerBtn} onClick={onDelete}>Excluir</button>}
      </div>
    </div>
  );
}

function ServicesView({ ctx }) {
  const { supabase, org, services, showToast, reload } = ctx;
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const save = async (data) => {
    if (editing) await supabase.from("services").update(data).eq("id", editing.id);
    else await supabase.from("services").insert({ org_id: org.id, ...data });
    await reload();
    setShowModal(false);
    showToast(editing ? "Serviço atualizado" : "Serviço cadastrado");
  };
  const remove = async (id) => { await supabase.from("services").delete().eq("id", id); await reload(); setShowModal(false); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button style={S.primaryBtn} onClick={() => { setEditing(null); setShowModal(true); }}>+ Novo serviço</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {services.map((s) => (
          <div key={s.id} style={S.listRow} onClick={() => { setEditing(s); setShowModal(true); }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
            <div style={{ fontSize: 13, color: "#9a9588" }}>{fmtMoney(s.price)} · {s.duration_minutes}min</div>
          </div>
        ))}
      </div>
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title={editing ? "Editar serviço" : "Novo serviço"}>
          <ServiceForm editing={editing} onSave={save} onDelete={editing ? () => remove(editing.id) : null} />
        </Modal>
      )}
    </div>
  );
}

function ServiceForm({ editing, onSave, onDelete }) {
  const [name, setName] = useState(editing?.name || "");
  const [price, setPrice] = useState(editing?.price ?? 0);
  const [duration, setDuration] = useState(editing?.duration_minutes ?? 30);
  return (
    <div>
      <Field label="Nome"><input style={S.input} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Preço"><input type="number" style={S.input} value={price} onChange={(e) => setPrice(Number(e.target.value))} /></Field>
      <Field label="Duração (minutos)"><input type="number" style={S.input} value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></Field>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button style={S.primaryBtn} onClick={() => name.trim() && onSave({ name: name.trim(), price, duration_minutes: duration })}>Salvar</button>
        {onDelete && <button style={S.dangerBtn} onClick={onDelete}>Excluir</button>}
      </div>
    </div>
  );
}

// ---------- Reports ----------
function ReportsView({ ctx }) {
  const { appointments, comandas, services, professionals, clients } = ctx;

  const byWeekday = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    appointments.forEach((a) => { counts[new Date(a.appt_date + "T12:00:00").getDay()]++; });
    return counts;
  }, [appointments]);

  const byService = useMemo(() => {
    const map = {};
    comandas.forEach((c) => (c.comanda_items || []).forEach((it) => {
      if (it.item_type !== "service") return;
      const svc = services.find((s) => s.id === it.ref_id);
      if (svc) map[svc.name] = (map[svc.name] || 0) + 1;
    }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [comandas, services]);

  const revenueByProf = useMemo(() => {
    const map = {};
    comandas.filter((c) => c.paid).forEach((c) => {
      const prof = professionals.find((p) => p.id === c.professional_id);
      if (prof) map[prof.name] = (map[prof.name] || 0) + Number(c.total);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [comandas, professionals]);

  const totalRevenue = comandas.filter((c) => c.paid).reduce((s, c) => s + Number(c.total), 0);
  const maxCount = Math.max(1, ...byWeekday);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard label="Faturamento total" value={fmtMoney(totalRevenue)} />
        <StatCard label="Atendimentos concluídos" value={comandas.filter((c) => c.paid).length} />
        <StatCard label="Clientes cadastrados" value={clients.length} />
      </div>
      <h3 style={S.sectionTitle}>Agendamentos por dia da semana</h3>
      <p style={{ fontSize: 12, color: "#9a9588", marginTop: -8, marginBottom: 12 }}>Use isso para saber em quais dias vale a pena oferecer promoção.</p>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 120, marginBottom: 28 }}>
        {WEEK_LABELS.map((label, idx) => (
          <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 11, color: "#9a9588" }}>{byWeekday[idx]}</div>
            <div style={{ width: "100%", height: `${(byWeekday[idx] / maxCount) * 80 + 4}px`, background: "#1D9E7522", borderRadius: 4, borderTop: "2px solid #1D9E75" }} />
            <div style={{ fontSize: 11, color: "#7a7669" }}>{label}</div>
          </div>
        ))}
      </div>
      <h3 style={S.sectionTitle}>Serviços mais vendidos</h3>
      <div style={{ marginBottom: 28 }}>
        {byService.length === 0 ? <div style={{ fontSize: 13, color: "#b0aca0" }}>Sem dados ainda</div> :
          byService.map(([name, count]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f1efe6" }}>
              <span>{name}</span><strong>{count}x</strong>
            </div>
          ))}
      </div>
      <h3 style={S.sectionTitle}>Faturamento por profissional</h3>
      <div>
        {revenueByProf.length === 0 ? <div style={{ fontSize: 13, color: "#b0aca0" }}>Sem dados ainda</div> :
          revenueByProf.map(([name, total]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f1efe6" }}>
              <span>{name}</span><strong>{fmtMoney(total)}</strong>
            </div>
          ))}
      </div>
    </div>
  );
}

// ---------- Settings ----------
function SettingsView({ ctx }) {
  const { supabase, org, showToast } = ctx;
  const [shopName, setShopName] = useState(org.name);
  const bookingUrl = typeof window !== "undefined" ? `${window.location.origin}/agendar/${org.slug}` : `/agendar/${org.slug}`;

  const save = async () => {
    await supabase.from("organizations").update({ name: shopName }).eq("id", org.id);
    showToast("Nome atualizado. Atualize a página para ver a mudança.");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    showToast("Link copiado!");
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <Field label="Nome da barbearia">
        <input style={S.input} value={shopName} onChange={(e) => setShopName(e.target.value)} />
      </Field>
      <button style={S.primaryBtn} onClick={save}>Salvar</button>

      <div style={{ marginTop: 28, padding: 16, background: "#faf8f2", borderRadius: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Link de agendamento para seus clientes</div>
        <div style={{ fontSize: 13, color: "#5f5e5a", wordBreak: "break-all", marginBottom: 10 }}>{bookingUrl}</div>
        <button style={S.secondaryBtn} onClick={copyLink}>Copiar link</button>
        <p style={{ fontSize: 12, color: "#9a9588", marginTop: 10 }}>
          Compartilhe esse link no seu Instagram ou WhatsApp — seus clientes marcam horário sozinhos, sem precisar de login.
        </p>
      </div>
    </div>
  );
}

// ---------- shared bits ----------
function Modal({ children, onClose, title }) {
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Field({ label, children, inline }) {
  return (
    <div style={{ marginBottom: inline ? 0 : 12, minWidth: inline ? 140 : undefined }}>
      <div style={{ fontSize: 12, color: "#9a9588", marginBottom: 4, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}
function EmptyState({ title, text }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#b0aca0" }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#7a7669", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13 }}>{text}</div>
    </div>
  );
}
function StatCard({ label, value }) {
  return (
    <div style={{ background: "#faf8f2", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: "#9a9588", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#1c1b18" }}>{value}</div>
    </div>
  );
}
function TabBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid " + (active ? "#1c1b18" : "#e4e1d6"), background: active ? "#1c1b18" : "transparent", color: active ? "#fff" : "#5f5e5a", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
      {label}
    </button>
  );
}

// ---------- styles ----------
const S = {
  app: { display: "flex", minHeight: "100vh", background: "#fcfaf5", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#1c1b18" },
  sidebar: { width: 220, background: "#fff", borderRight: "1px solid #ece9de", padding: "20px 14px", flexShrink: 0 },
  brand: { display: "flex", alignItems: "center", gap: 10, padding: "0 6px" },
  brandMark: { width: 34, height: 34, borderRadius: 10, background: "#1c1b18", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 },
  navItem: { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 10px", border: "none", background: "transparent", textAlign: "left", fontSize: 13.5, color: "#5f5e5a", borderRadius: 8, cursor: "pointer", marginBottom: 2, fontWeight: 500 },
  navItemActive: { background: "#1c1b18", color: "#fff" },
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 28px", borderBottom: "1px solid #ece9de", background: "#fff" },
  content: { padding: "24px 28px", overflowY: "auto" },
  dateInput: { border: "1px solid #e4e1d6", borderRadius: 8, padding: "7px 10px", fontSize: 13, background: "#fff" },
  iconBtn: { width: 30, height: 30, borderRadius: 8, border: "1px solid #e4e1d6", background: "#fff", cursor: "pointer", fontSize: 15, color: "#5f5e5a" },
  todayBtn: { padding: "7px 12px", borderRadius: 8, border: "1px solid #e4e1d6", background: "#fff", fontSize: 13, cursor: "pointer", color: "#5f5e5a" },
  primaryBtn: { padding: "9px 16px", borderRadius: 8, border: "none", background: "#1c1b18", color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer" },
  secondaryBtn: { padding: "9px 14px", borderRadius: 8, border: "1px solid #e4e1d6", background: "#fff", color: "#5f5e5a", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  dangerBtn: { padding: "9px 14px", borderRadius: 8, border: "1px solid #f0997b", background: "#fff", color: "#993C1D", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  pill: { padding: "7px 14px", borderRadius: 99, border: "1px solid #e4e1d6", fontSize: 13, cursor: "pointer" },
  dayCol: { background: "#fff", border: "1px solid #ece9de", borderRadius: 12, padding: 12, minHeight: 200 },
  apptBlock: { background: "#faf8f2", borderRadius: 6, padding: "6px 10px", marginBottom: 4, cursor: "pointer" },
  emptySlot: { padding: "6px 10px", marginBottom: 4, borderRadius: 6, cursor: "pointer", border: "1px dashed #ece9de" },
  doneTag: { fontSize: 10, color: "#0F6E56", fontWeight: 700, marginTop: 2 },
  depositTag: { fontSize: 10, color: "#185FA5", fontWeight: 700, marginTop: 2 },
  card: { background: "#fff", border: "1px solid #ece9de", borderRadius: 12, padding: 16 },
  listRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: "1px solid #ece9de", borderRadius: 10, padding: "12px 16px", cursor: "pointer" },
  input: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e4e1d6", fontSize: 13.5, boxSizing: "border-box", background: "#fff", color: "#1c1b18" },
  select: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e4e1d6", fontSize: 13.5, background: "#fff", color: "#1c1b18" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(28,27,24,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 },
  modalBox: { background: "#fff", borderRadius: 14, padding: 22, width: 420, maxWidth: "100%", maxHeight: "85vh", overflowY: "auto", boxSizing: "border-box" },
  closeBtn: { border: "none", background: "transparent", fontSize: 16, cursor: "pointer", color: "#9a9588" },
  alertBox: { background: "#FAEEDA", color: "#633806", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 700, marginBottom: 4 },
  dayToggle: { padding: "6px 9px", borderRadius: 6, border: "1px solid #e4e1d6", fontSize: 11.5, cursor: "pointer" },
  toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1c1b18", color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 13, zIndex: 100, maxWidth: "90%", textAlign: "center" },
  loadingScreen: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" },
  bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #ece9de", display: "flex", justifyContent: "space-around", padding: "8px 4px", zIndex: 40 },
  bottomNavItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, border: "none", background: "transparent", cursor: "pointer", padding: "4px 6px" },
};
