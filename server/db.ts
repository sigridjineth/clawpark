import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

function ensureColumn(db: DatabaseSync, table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (columns.some((entry) => entry.name === column)) {
    return;
  }
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

export function createDatabase(filename: string) {
  mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      discord_user_id TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      discord_handle TEXT NOT NULL,
      profile_url TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS drafts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      claw_json TEXT NOT NULL,
      manifest_json TEXT NOT NULL,
      bundle_path TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft'
    );

    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      current_version INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS listing_versions (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      draft_id TEXT REFERENCES drafts(id) ON DELETE SET NULL,
      version INTEGER NOT NULL,
      claw_json TEXT NOT NULL,
      manifest_json TEXT NOT NULL,
      bundle_path TEXT NOT NULL,
      published_at TEXT NOT NULL,
      UNIQUE(listing_id, version)
    );

    CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON drafts(user_id);
    CREATE INDEX IF NOT EXISTS idx_listing_versions_listing_id ON listing_versions(listing_id);
  `);

  ensureColumn(db, 'users', 'auth_kind', "TEXT NOT NULL DEFAULT 'discord'");
  ensureColumn(db, 'listings', 'kind', "TEXT NOT NULL DEFAULT 'claw'");
  ensureColumn(db, 'listings', 'trust', "TEXT NOT NULL DEFAULT 'verified'");
  ensureColumn(db, 'listings', 'publisher_mode', "TEXT NOT NULL DEFAULT 'discord-session'");
  ensureColumn(db, 'listings', 'install_hint', 'TEXT');

  return db;
}

export type SqliteDatabase = ReturnType<typeof createDatabase>;
