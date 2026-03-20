import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

function ensureColumn(db: DatabaseSync, table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (columns.some((entry) => entry.name === column)) {
    return;
  }
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

function loadSqlMigrations() {
  const migrationsDir = new URL('./migrations/', import.meta.url);
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((entry) => ({
      id: entry.name.replace(/\.sql$/, ''),
      sql: readFileSync(new URL(entry.name, migrationsDir), 'utf8'),
    }));
}

function createSchemaMigrationsTable(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
}

function appliedMigrationIds(db: DatabaseSync) {
  createSchemaMigrationsTable(db);
  const rows = db.prepare('SELECT id FROM schema_migrations ORDER BY id').all() as Array<{ id: string }>;
  return new Set(rows.map((row) => row.id));
}

function recordMigration(db: DatabaseSync, id: string) {
  db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(id, new Date().toISOString());
}

function hasLegacySchema(db: DatabaseSync) {
  const rows = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
      AND name != 'schema_migrations'
  `).all() as Array<{ name: string }>;
  return rows.length > 0;
}

function applyLegacyCompatibilityColumns(db: DatabaseSync) {
  ensureColumn(db, 'users', 'auth_kind', "TEXT NOT NULL DEFAULT 'discord'");
  ensureColumn(db, 'listings', 'kind', "TEXT NOT NULL DEFAULT 'claw'");
  ensureColumn(db, 'listings', 'trust', "TEXT NOT NULL DEFAULT 'verified'");
  ensureColumn(db, 'listings', 'publisher_mode', "TEXT NOT NULL DEFAULT 'discord-session'");
  ensureColumn(db, 'listings', 'install_hint', 'TEXT');
  ensureColumn(db, 'breeding_runs', 'saved', 'INTEGER NOT NULL DEFAULT 0');
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
}

export function createDatabase(filename: string) {
  mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys = ON;');
  const migrations = loadSqlMigrations();
  const applied = appliedMigrationIds(db);

  if (applied.size === 0 && hasLegacySchema(db) && migrations[0]) {
    db.exec(migrations[0].sql);
    applyLegacyCompatibilityColumns(db);
    recordMigration(db, migrations[0].id);
    applied.add(migrations[0].id);
  }

  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;
    db.exec(migration.sql);
    recordMigration(db, migration.id);
  }

  return db;
}

export type SqliteDatabase = ReturnType<typeof createDatabase>;
