const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const pad = (n: number) => String(n).padStart(2, '0');

// "Jum'at, 25 September"
export function formatDayHeading(date: Date) {
  return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

// "25 September 2026"
export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// "09.00" (format jam Indonesia)
export function formatTime(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}.${pad(d.getMinutes())}`;
}

export function formatDuration(ms: number | null) {
  if (!ms) return '';
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

// Mengubah "25/09/2026" + "09.00" menjadi ISO. Mengembalikan null bila tidak valid.
export function parseLocalDateTime(date: string, time: string) {
  const dm = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(date.trim());
  const tm = /^(\d{1,2})[.:](\d{2})$/.exec(time.trim());
  if (!dm || !tm) return null;
  const d = new Date(+dm[3], +dm[2] - 1, +dm[1], +tm[1], +tm[2]);
  if (Number.isNaN(d.getTime()) || d.getDate() !== +dm[1]) return null;
  return d.toISOString();
}

export function toDateInput(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function toTimeInput(d: Date) {
  return `${pad(d.getHours())}.${pad(d.getMinutes())}`;
}
