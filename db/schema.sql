PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  discord_user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  discord_handle TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  auth_kind TEXT NOT NULL DEFAULT 'discord'
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
  current_version INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT 'claw',
  trust TEXT NOT NULL DEFAULT 'verified',
  publisher_mode TEXT NOT NULL DEFAULT 'discord-session',
  install_hint TEXT
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

