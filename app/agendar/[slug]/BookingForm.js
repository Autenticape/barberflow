"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "../../../lib/supabase-browser";
import { todayISO, fmtMoney, fmtDatePT, weekdayPT, addDays, buildSlots } from "../../../lib/utils";

export default function BookingForm({ org, professionals, services }) {
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [profId, setProfId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const selectedProf = professionals.find((p) => p.id === profId);
  const selectedService = services.find((s) => s.id === serviceId);

  const loadSlots = useCallback(async () => {
    if (!profId || !date) return;
    const { data } = await supabase
      .from("appointments")
      .select("appt_time")
      .eq("professional_id", profId)
      .eq("appt_date", date)
      .neq("status", "cancelado");
    setBookedSlots((data || []).map((a) => a.appt_time?.slice(0, 5)));
  }, [profId, date, supabase]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const weekday = new Date(date + "T12:00:00").getDay();
  const availableSlots = selectedProf
    ? buildSlots({
        start: selectedProf.work_start?.slice(0, 5),
        end: selectedProf.work_end?.slice(0, 5),
        lunchStart: selectedProf.lunch_start?.slice(0, 5),
        lunchEnd: selectedProf.lunch_end?.slice(0, 5),
      }).filter((s) => !bookedSlots.includes(s))
    : [];
  const profWorksToday = selectedProf ? (selectedProf.work_days || []).includes(weekday) : false;

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError("Preencha seu nome e telefone.");
      return;
    }
    setSubmitting(true);
    setError("");

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setError("Variaveis ausentes: URL=" + url + " KEY=" + (key ? "ok" : "ausente"));
      setSubmitting(false);
      return;
    }

    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .insert({ org_id: org.id, name: name.trim(), phone: phone.trim() })
      .select()
      .single();

    if (clientErr) {
      setError("Erro cliente: " + clientErr.message + " | codigo: " + clientErr.code);
      setSubmitting(false);
      return;
    }

    const { error: apptErr } = await supabase.from("appointments").insert({
      org_id: org.id,
      client_id: client.id,
      professional_id: profId,
      service_id: serviceId,
      appt_date: date,
      appt_time: time,
      status: "confirmado",
    });

    if (apptErr) {
      setError("Erro agendamento: " + apptErr.message + " | codigo: " + apptErr.code);
      setSubmitting(false);
      await loadSlots();
      return;
    }

    setDone(true);
    setSubmitting(false);
  };

  if (done) {
    return (
      <Wrap org={org}>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Agendamento confirmado!</h2>
          <p style={{ color: "#7a7669", fontSize: 14 }}>
            {selectedService?.name} com {selectedProf?.name}<br />
            {weekdayPT(date)}, {fmtDatePT(date)} às {time}
          </p>
        </div>
      </Wrap>
    );
  }

  return (
    <Wrap org={org}>
      {step === 1 && (
        <div>
          <Label>Escolha o profissional</Label>
          {professionals.length === 0 ? (
            <Empty>Nenhum profissional disponível no momento.</Empty>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {professionals.map((p) => (
                <OptionCard key={p.id} selected={profId === p.id} onClick={() => setProfId(p.id)}>
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: p.color, display: "inline-block", marginRight: 8 }} />
                  {p.name}
                </OptionCard>
              ))}
            </div>
          )}
          <Label>Escolha o serviço</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {services.map((s) => (
              <OptionCard key={s.id} selected={serviceId === s.id} onClick={() => setServiceId(s.id)}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{s.name}</span>
                  <span style={{ color: "#9a9588" }}>{fmtMoney(s.price)} · {s.duration_minutes}min</span>
                </div>
              </OptionCard>
            ))}
          </div>
          <Button disabled={!profId || !serviceId} onClick={() => setStep(2)}>Escolher horário</Button>
        </div>
      )}

      {step === 2 && (
        <div>
          <Label>Escolha o dia</Label>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
            <button style={S.iconBtn} onClick={() => setDate(addDays(date, -1))}>‹</button>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={S.input} />
            <button style={S.iconBtn} onClick={() => setDate(addDays(date, 1))}>›</button>
          </div>
          <div style={{ fontSize: 13, color: "#9a9588", marginBottom: 14 }}>{weekdayPT(date)}, {fmtDatePT(date)}</div>

          <Label>Escolha o horário</Label>
          {!profWorksToday ? (
            <Empty>{selectedProf?.name} não atende neste dia. Escolha outra data.</Empty>
          ) : availableSlots.length === 0 ? (
            <Empty>Sem horários livres neste dia.</Empty>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 24 }}>
              {availableSlots.map((slot) => (
                <button key={slot} onClick={() => setTime(slot)} style={{ ...S.slotBtn, ...(time === slot ? S.slotBtnActive : {}) }}>
                  {slot}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => setStep(1)}>Voltar</Button>
            <Button disabled={!time} onClick={() => setStep(3)}>Continuar</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ background: "#faf8f2", borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{selectedService?.name}</div>
            <div style={{ color: "#7a7669" }}>com {selectedProf?.name} · {weekdayPT(date)}, {fmtDatePT(date)} às {time}</div>
          </div>
          <Label>Seu nome</Label>
          <input style={{ ...S.input, marginBottom: 14 }} value={name} onChange={(e) => setName(e.target.value)} />
          <Label>Seu telefone (WhatsApp)</Label>
          <input style={{ ...S.input, marginBottom: 14 }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          {error && <div style={S.error}>{error}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setStep(2)}>Voltar</Button>
            <Button disabled={submitting} onClick={handleSubmit}>{submitting ? "Confirmando..." : "Confirmar agendamento"}</Button>
          </div>
        </div>
      )}
    </Wrap>
  );
}

function Wrap({ org, children }) {
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={S.brandMark}>✂</div>
          <h1 style={{ fontSize: 18, margin: "10px 0 0" }}>{org.name}</h1>
          <p style={{ fontSize: 12, color: "#9a9588", margin: "2px 0 0" }}>Agende seu horário</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: "#7a7669", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.3 }}>{children}</div>;
}
function Empty({ children }) {
  return <div style={{ fontSize: 13, color: "#b0aca0", padding: "16px 0", marginBottom: 16 }}>{children}</div>;
}
function OptionCard({ selected, onClick, children }) {
  return (
    <div onClick={onClick} style={{ padding: "12px 14px", borderRadius: 10, border: "1.5px solid " + (selected ? "#1c1b18" : "#e4e1d6"), background: selected ? "#faf8f2" : "#fff", fontSize: 14, cursor: "pointer" }}>
      {children}
    </div>
  );
}
function Button({ children, onClick, disabled, variant }) {
  const isSecondary = variant === "secondary";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, padding: "12px", borderRadius: 10, border: isSecondary ? "1px solid #e4e1d6" : "none",
        background: disabled ? "#e4e1d6" : isSecondary ? "#fff" : "#1c1b18",
        color: isSecondary ? "#5f5e5a" : "#fff", fontSize: 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#fcfaf5", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  card: { background: "#fff", borderRadius: 16, border: "1px solid #ece9de", padding: 24, width: 420, maxWidth: "100%" },
  brandMark: { width: 40, height: 40, borderRadius: 12, background: "#1c1b18", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e4e1d6", fontSize: 14, boxSizing: "border-box" },
  iconBtn: { width: 36, height: 36, borderRadius: 8, border: "1px solid #e4e1d6", background: "#fff", cursor: "pointer", fontSize: 16, color: "#5f5e5a" },
  slotBtn: { padding: "10px 4px", borderRadius: 8, border: "1px solid #e4e1d6", background: "#fff", fontSize: 13, cursor: "pointer" },
  slotBtnActive: { background: "#1c1b18", color: "#fff", borderColor: "#1c1b18" },
  error: { background: "#FCEBEB", color: "#791F1F", fontSize: 13, padding: "8px 12px", borderRadius: 8, marginBottom: 10 },
};
