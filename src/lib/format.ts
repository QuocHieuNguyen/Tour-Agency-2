const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-02-20" -> "20/02/2026" */
export function fmtDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** ISO datetime -> "11:37 31/01/2026" */
export function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Số ngày từ hôm nay đến ngày đi (âm = đã qua) */
export function daysFromToday(isoDate: string) {
  if (!isoDate) return null;
  const t = new Date(isoDate + "T00:00:00");
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - now.getTime()) / 86_400_000);
}

export function daysAgo(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

/** "297d 10h 4m" kể từ lúc tạo */
export function elapsed(iso: string) {
  const ms = Math.max(0, Date.now() - new Date(iso).getTime());
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${d}d ${h}h ${m}m`;
}
