export const ACTIVITY_TYPES = [
  { key: 'narasumber', label: 'Narasumber', icon: '🎤' },
  { key: 'asistensi', label: 'Asistensi', icon: '🤝' },
  { key: 'lapangan', label: 'Lapangan', icon: '🚗' },
  { key: 'kantor', label: 'Kegiatan Kantor', icon: '🏢' },
  { key: 'rapat', label: 'Rapat', icon: '🧑‍💼' },
  { key: 'inisiatif', label: 'Inisiatif', icon: '💡' },
  { key: 'koordinasi', label: 'Koordinasi', icon: '📞' },
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number]['key'];

export function activityTypeInfo(key: string) {
  return ACTIVITY_TYPES.find((t) => t.key === key) ?? ACTIVITY_TYPES[0];
}

// Jenis kegiatan yang biasanya berupa perjalanan dinas (butuh SPT, DPA, transportasi).
export const TRAVEL_TYPES: readonly string[] = ['narasumber', 'asistensi', 'lapangan', 'koordinasi'];

export type ActivityStatus = 'rencana' | 'persiapan' | 'berlangsung' | 'selesai';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  organizer: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  start_at: string;
  end_at: string | null;
  status: ActivityStatus;
  spt_number: string | null;
  spt_date: string | null;
  dpa: string | null;
  transport: string | null;
  background: string | null;
  objectives: string | null;
  notes: string | null;
  report_status: 'belum' | 'draft' | 'selesai';
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  activity_id: string;
  label: string;
  at: string;
}

export interface Media {
  id: string;
  activity_id: string;
  kind: 'photo' | 'voice';
  local_uri: string;
  caption: string | null;
  duration_ms: number | null;
  include_in_report: number;
  taken_at: string;
}

export const DOCUMENT_ROLES = [
  { key: 'undangan', label: 'Undangan' },
  { key: 'bahan_penyelenggara', label: 'Bahan penyelenggara' },
  { key: 'bahan_saya', label: 'Bahan saya' },
  { key: 'lainnya', label: 'Lainnya' },
] as const;

export type DocumentRole = (typeof DOCUMENT_ROLES)[number]['key'];

export interface ActivityDocument {
  id: string;
  activity_id: string;
  role: DocumentRole;
  title: string;
  mime_type: string | null;
  size: number | null;
  local_uri: string;
}

// Mengikuti bab laporan perjalanan dinas: III Hasil, IV Kesimpulan / Saran dan Rekomendasi.
export type FindingKind = 'hasil' | 'kesimpulan' | 'rekomendasi';

export interface Finding {
  id: string;
  activity_id: string;
  kind: FindingKind;
  text: string;
  position: number;
}

export interface FollowUp {
  id: string;
  activity_id: string;
  text: string;
  due_date: string | null;
  done: number;
}

export const TIMELINE_LABELS = ['Berangkat', 'Tiba', 'Mulai', 'Istirahat', 'Selesai', 'Pulang'] as const;
