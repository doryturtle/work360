import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Activity,
  ActivityDocument,
  ActivityType,
  DocumentRole,
  Finding,
  FindingKind,
  FollowUp,
  Media,
  TimelineEvent,
} from '../lib/types';

const now = () => new Date().toISOString();

export function dayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function listActivitiesBetween(db: SQLiteDatabase, start: string, end: string) {
  return db.getAllAsync<Activity>(
    `SELECT * FROM activity WHERE deleted_at IS NULL AND start_at >= ? AND start_at < ? ORDER BY start_at`,
    start,
    end,
  );
}

export async function listRecentActivities(db: SQLiteDatabase, limit = 20) {
  return db.getAllAsync<Activity>(
    `SELECT * FROM activity WHERE deleted_at IS NULL ORDER BY start_at DESC LIMIT ?`,
    limit,
  );
}

export async function homeCounts(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ reports: number; followUps: number }>(
    `SELECT
       (SELECT COUNT(*) FROM activity
         WHERE deleted_at IS NULL AND status = 'selesai' AND report_status != 'selesai') AS reports,
       (SELECT COUNT(*) FROM follow_up WHERE deleted_at IS NULL AND done = 0) AS followUps`,
  );
  return row ?? { reports: 0, followUps: 0 };
}

export async function getActivity(db: SQLiteDatabase, id: string) {
  return db.getFirstAsync<Activity>(`SELECT * FROM activity WHERE id = ? AND deleted_at IS NULL`, id);
}

export interface NewActivity {
  type: ActivityType;
  title: string;
  organizer?: string | null;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  start_at: string;
  spt_number?: string | null;
  spt_date?: string | null;
  dpa?: string | null;
  transport?: string | null;
}

export async function createActivity(db: SQLiteDatabase, input: NewActivity) {
  const id = randomUUID();
  const ts = now();
  await db.runAsync(
    `INSERT INTO activity (id, type, title, organizer, location_name, latitude, longitude, start_at,
       spt_number, spt_date, dpa, transport, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'rencana', ?, ?)`,
    id,
    input.type,
    input.title,
    input.organizer ?? null,
    input.location_name ?? null,
    input.latitude ?? null,
    input.longitude ?? null,
    input.start_at,
    input.spt_number ?? null,
    input.spt_date ?? null,
    input.dpa ?? null,
    input.transport ?? null,
    ts,
    ts,
  );
  return id;
}

type ActivityPatch = Partial<Omit<Activity, 'id' | 'created_at' | 'updated_at'>>;

export async function updateActivity(db: SQLiteDatabase, id: string, patch: ActivityPatch) {
  const keys = Object.keys(patch) as (keyof ActivityPatch)[];
  if (keys.length === 0) return;
  const sets = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (patch[k] ?? null) as string | number | null);
  await db.runAsync(`UPDATE activity SET ${sets}, updated_at = ? WHERE id = ?`, ...values, now(), id);
}

export async function listTimeline(db: SQLiteDatabase, activityId: string) {
  return db.getAllAsync<TimelineEvent>(
    `SELECT * FROM timeline_event WHERE activity_id = ? AND deleted_at IS NULL ORDER BY at`,
    activityId,
  );
}

export async function addTimelineEvent(db: SQLiteDatabase, activityId: string, label: string) {
  const ts = now();
  await db.runAsync(
    `INSERT INTO timeline_event (id, activity_id, label, at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    randomUUID(),
    activityId,
    label,
    ts,
    ts,
  );
  // Tanda waktu juga menggerakkan status kegiatan.
  if (label === 'Selesai' || label === 'Pulang') {
    await updateActivity(db, activityId, { status: 'selesai', end_at: ts });
  } else {
    await db.runAsync(
      `UPDATE activity SET status = 'berlangsung', updated_at = ? WHERE id = ? AND status IN ('rencana', 'persiapan')`,
      ts,
      activityId,
    );
  }
}

export async function listMedia(db: SQLiteDatabase, activityId: string) {
  return db.getAllAsync<Media>(
    `SELECT * FROM media WHERE activity_id = ? AND deleted_at IS NULL ORDER BY taken_at`,
    activityId,
  );
}

export async function addMedia(
  db: SQLiteDatabase,
  input: { activityId: string; kind: Media['kind']; localUri: string; durationMs?: number | null },
) {
  const ts = now();
  await db.runAsync(
    `INSERT INTO media (id, activity_id, kind, local_uri, duration_ms, taken_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    randomUUID(),
    input.activityId,
    input.kind,
    input.localUri,
    input.durationMs ?? null,
    ts,
    ts,
  );
}

export async function listDocuments(db: SQLiteDatabase, activityId: string) {
  return db.getAllAsync<ActivityDocument>(
    `SELECT * FROM document WHERE activity_id = ? AND deleted_at IS NULL ORDER BY role, title`,
    activityId,
  );
}

export async function addDocument(
  db: SQLiteDatabase,
  input: {
    activityId: string;
    role: DocumentRole;
    title: string;
    mimeType: string | null;
    size: number | null;
    localUri: string;
  },
) {
  await db.runAsync(
    `INSERT INTO document (id, activity_id, role, title, mime_type, size, local_uri, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    randomUUID(),
    input.activityId,
    input.role,
    input.title,
    input.mimeType,
    input.size,
    input.localUri,
    now(),
  );
}

export async function listFindings(db: SQLiteDatabase, activityId: string) {
  return db.getAllAsync<Finding>(
    `SELECT * FROM finding WHERE activity_id = ? AND deleted_at IS NULL ORDER BY kind, position`,
    activityId,
  );
}

export async function listFollowUps(db: SQLiteDatabase, activityId: string) {
  return db.getAllAsync<FollowUp>(
    `SELECT * FROM follow_up WHERE activity_id = ? AND deleted_at IS NULL ORDER BY rowid`,
    activityId,
  );
}

// Simpan hasil "Selesaikan Kegiatan": satu baris teks = satu butir.
export async function saveWrapUp(
  db: SQLiteDatabase,
  activityId: string,
  input: { notes: string; findings: Record<FindingKind, string>; followUps: string },
) {
  const ts = now();
  const lines = (text: string) =>
    text
      .split('\n')
      .map((l) => l.replace(/^\s*[-•\d.)]+\s*/, '').trim())
      .filter(Boolean);

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE activity SET notes = ?, status = 'selesai', end_at = COALESCE(end_at, ?), updated_at = ? WHERE id = ?`,
      input.notes.trim() || null,
      ts,
      ts,
      activityId,
    );
    await db.runAsync(
      `UPDATE finding SET deleted_at = ?, updated_at = ? WHERE activity_id = ? AND deleted_at IS NULL`,
      ts,
      ts,
      activityId,
    );
    for (const kind of Object.keys(input.findings) as FindingKind[]) {
      const items = lines(input.findings[kind]);
      for (let i = 0; i < items.length; i++) {
        await db.runAsync(
          `INSERT INTO finding (id, activity_id, kind, text, position, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
          randomUUID(),
          activityId,
          kind,
          items[i],
          i,
          ts,
        );
      }
    }
    await db.runAsync(
      `UPDATE follow_up SET deleted_at = ?, updated_at = ? WHERE activity_id = ? AND deleted_at IS NULL AND done = 0`,
      ts,
      ts,
      activityId,
    );
    for (const text of lines(input.followUps)) {
      await db.runAsync(
        `INSERT INTO follow_up (id, activity_id, text, updated_at) VALUES (?, ?, ?, ?)`,
        randomUUID(),
        activityId,
        text,
        ts,
      );
    }
  });
}
