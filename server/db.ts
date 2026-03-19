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

  // ClawPark v1 tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS import_records (
      id TEXT PRIMARY KEY,
      source_kind TEXT NOT NULL DEFAULT 'openclaw_zip',
      uploaded_at TEXT NOT NULL,
      included_files TEXT NOT NULL DEFAULT '[]',
      ignored_files TEXT NOT NULL DEFAULT '[]',
      warnings TEXT NOT NULL DEFAULT '[]',
      fingerprint TEXT NOT NULL DEFAULT '',
      parsed_specimen_id TEXT,
      discord_user_id TEXT
    );

    CREATE TABLE IF NOT EXISTS specimens (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      claw_json TEXT NOT NULL,
      ownership_state TEXT NOT NULL DEFAULT 'imported',
      breed_state TEXT NOT NULL DEFAULT 'ready',
      discord_user_id TEXT,
      import_record_id TEXT REFERENCES import_records(id),
      parent_a_id TEXT,
      parent_b_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS breeding_runs (
      id TEXT PRIMARY KEY,
      parent_a_id TEXT NOT NULL REFERENCES specimens(id),
      parent_b_id TEXT NOT NULL REFERENCES specimens(id),
      prompt TEXT,
      conversation_json TEXT,
      prediction_json TEXT,
      result_child_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS breeding_intents (
      id TEXT PRIMARY KEY,
      source_surface TEXT NOT NULL DEFAULT 'api',
      source_message TEXT,
      requester_identity TEXT,
      target_specimen_ids TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'intent_created',
      suggested_candidates TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS breeding_consents (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      owner_identity TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      responded_at TEXT,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS breeding_proposals (
      id TEXT PRIMARY KEY,
      parent_a_id TEXT NOT NULL REFERENCES specimens(id),
      parent_b_id TEXT NOT NULL REFERENCES specimens(id),
      requester_id TEXT NOT NULL,
      consent_status TEXT NOT NULL DEFAULT 'pending',
      intent_id TEXT REFERENCES breeding_intents(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS provenance (
      id TEXT PRIMARY KEY,
      specimen_id TEXT NOT NULL REFERENCES specimens(id),
      source_kind TEXT NOT NULL DEFAULT 'openclaw_zip',
      source_hash TEXT NOT NULL,
      import_record_id TEXT REFERENCES import_records(id),
      original_paths TEXT NOT NULL DEFAULT '[]',
      parser_version TEXT NOT NULL DEFAULT '1.0',
      warnings TEXT NOT NULL DEFAULT '[]',
      claimed_by_discord_user_id TEXT,
      claimed_by_discord_handle TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_specimens_ownership ON specimens(ownership_state);
    CREATE INDEX IF NOT EXISTS idx_specimens_discord ON specimens(discord_user_id);
    CREATE INDEX IF NOT EXISTS idx_breeding_runs_parents ON breeding_runs(parent_a_id, parent_b_id);
    CREATE INDEX IF NOT EXISTS idx_breeding_intents_status ON breeding_intents(status);
    CREATE INDEX IF NOT EXISTS idx_provenance_specimen ON provenance(specimen_id);
    CREATE INDEX IF NOT EXISTS idx_breeding_runs_child ON breeding_runs(result_child_id);
  `);

  ensureColumn(db, 'breeding_runs', 'saved', 'INTEGER NOT NULL DEFAULT 0');

  // Ensure v1 route columns exist (safe migrations for breeding tables)
  ensureColumn(db, 'breeding_intents', 'parsed_action', 'TEXT');
  ensureColumn(db, 'breeding_intents', 'proposal_id', 'TEXT');
  ensureColumn(db, 'breeding_intents', 'run_id', 'TEXT');
  ensureColumn(db, 'breeding_intents', 'result_child_id', 'TEXT');
  ensureColumn(db, 'breeding_intents', 'block_reason', 'TEXT');
  ensureColumn(db, 'breeding_intents', 'updated_at', "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, 'breeding_proposals', 'owner_relationship', "TEXT NOT NULL DEFAULT 'unknown-owner'");
  ensureColumn(db, 'breeding_proposals', 'consent_required', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(db, 'breeding_proposals', 'consent_id', 'TEXT');
  ensureColumn(db, 'breeding_proposals', 'updated_at', "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, 'breeding_consents', 'specimen_id', 'TEXT');
  ensureColumn(db, 'breeding_consents', 'requested_at', "TEXT NOT NULL DEFAULT ''");

  return db;
}

export type SqliteDatabase = ReturnType<typeof createDatabase>;
