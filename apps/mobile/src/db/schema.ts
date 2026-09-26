import type { SQLiteDatabase } from 'expo-sqlite';

// Setiap tabel memakai UUID yang dibuat di HP, updated_at, dan deleted_at (hapus lunak)
// supaya nanti bisa disinkronkan ke server tanpa bentrok ID.
const MIGRATIONS: string[] = [
  `
  CREATE TABLE activity (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    organizer TEXT,
    location_name TEXT,
    latitude REAL,
    longitude REAL,
    start_at TEXT NOT NULL,
    end_at TEXT,
    status TEXT NOT NULL DEFAULT 'rencana',
    spt_number TEXT,
    spt_date TEXT,
    dpa TEXT,
    transport TEXT,
    background TEXT,
    objectives TEXT,
    notes TEXT,
    report_status TEXT NOT NULL DEFAULT 'belum',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX activity_start_at ON activity (start_at);

  CREATE TABLE timeline_event (
    id TEXT PRIMARY KEY NOT NULL,
    activity_id TEXT NOT NULL REFERENCES activity (id),
    label TEXT NOT NULL,
    at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX timeline_event_activity ON timeline_event (activity_id);

  CREATE TABLE media (
    id TEXT PRIMARY KEY NOT NULL,
    activity_id TEXT NOT NULL REFERENCES activity (id),
    kind TEXT NOT NULL,
    local_uri TEXT NOT NULL,
    storage_key TEXT,
    caption TEXT,
    duration_ms INTEGER,
    include_in_report INTEGER NOT NULL DEFAULT 1,
    taken_at TEXT NOT NULL,
    upload_status TEXT NOT NULL DEFAULT 'lokal',
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX media_activity ON media (activity_id);

  CREATE TABLE document (
    id TEXT PRIMARY KEY NOT NULL,
    activity_id TEXT NOT NULL REFERENCES activity (id),
    role TEXT NOT NULL,
    title TEXT NOT NULL,
    mime_type TEXT,
    size INTEGER,
    local_uri TEXT NOT NULL,
    storage_key TEXT,
    upload_status TEXT NOT NULL DEFAULT 'lokal',
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX document_activity ON document (activity_id);

  CREATE TABLE finding (
    id TEXT PRIMARY KEY NOT NULL,
    activity_id TEXT NOT NULL REFERENCES activity (id),
    kind TEXT NOT NULL,
    text TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX finding_activity ON finding (activity_id);

  CREATE TABLE follow_up (
    id TEXT PRIMARY KEY NOT NULL,
    activity_id TEXT NOT NULL REFERENCES activity (id),
    text TEXT NOT NULL,
    due_date TEXT,
    done INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );
  CREATE INDEX follow_up_activity ON follow_up (activity_id);
  `,
];

export async function migrate(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
    });
    version += 1;
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}
