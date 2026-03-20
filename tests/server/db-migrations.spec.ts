// @vitest-environment node
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../server/db.ts';

describe('database migrations', () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      rmSync(tempRoots.pop()!, { recursive: true, force: true });
    }
  });

  it('applies SQL migrations to a fresh database', () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'clawpark-db-fresh-'));
    tempRoots.push(tempRoot);
    const dbPath = join(tempRoot, 'marketplace.sqlite');

    const db = createDatabase(dbPath);
    expect(existsSync(dbPath)).toBe(true);

    const migrations = db.prepare('SELECT id FROM schema_migrations ORDER BY id').all() as Array<{ id: string }>;
    expect(migrations.map((row) => row.id)).toContain('001_initial');

    const tables = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    `).all() as Array<{ name: string }>;
    const names = tables.map((row) => row.name);
    expect(names).toContain('users');
    expect(names).toContain('specimens');
    expect(names).toContain('breeding_runs');
    expect(names).toContain('schema_migrations');
  });

  it('adopts an existing unversioned database without dropping data', () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'clawpark-db-legacy-'));
    tempRoots.push(tempRoot);
    const dbPath = join(tempRoot, 'marketplace.sqlite');

    const legacyDb = new DatabaseSync(dbPath);
    legacyDb.exec(`
      CREATE TABLE users (
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
      INSERT INTO users (id, discord_user_id, username, display_name, avatar_url, discord_handle, profile_url, created_at, updated_at)
      VALUES ('legacy-user', 'discord-legacy', 'legacy', 'Legacy', NULL, '@legacy', 'https://discord.com/users/discord-legacy', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');
    `);
    legacyDb.close();

    const db = createDatabase(dbPath);
    const migrations = db.prepare('SELECT id FROM schema_migrations ORDER BY id').all() as Array<{ id: string }>;
    expect(migrations.map((row) => row.id)).toContain('001_initial');

    const user = db.prepare('SELECT discord_user_id, auth_kind FROM users WHERE id = ?').get('legacy-user') as { discord_user_id: string; auth_kind: string };
    expect(user.discord_user_id).toBe('discord-legacy');
    expect(user.auth_kind).toBe('discord');
  });
});
