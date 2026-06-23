export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const fmtMoney = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDatePT = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const weekdayPT = (iso) => {
  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const dt = new Date(iso + "T12:00:00");
  return days[dt.getDay()];
};

export const addDays = (iso, n) => {
  const dt = new Date(iso + "T12:00:00");
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

export const timeToMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const minToTime = (min) => {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

export const WEEK_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function buildSlots(hours) {
  const slots = [];
  const step = 30;
  let cur = timeToMin(hours.work_start || hours.start);
  const end = timeToMin(hours.work_end || hours.end);
  const lunchS = timeToMin(hours.lunch_start || hours.lunchStart || "00:00");
  const lunchE = timeToMin(hours.lunch_end || hours.lunchEnd || "00:00");
  while (cur < end) {
    if (!(cur >= lunchS && cur < lunchE)) slots.push(minToTime(cur));
    cur += step;
  }
  return slots;
}

export function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}
