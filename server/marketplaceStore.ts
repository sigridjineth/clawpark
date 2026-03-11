import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Claw } from '../src/types/claw.ts';
import type {
  ClawBundle,
  ClawBundleManifest,
  MarketplaceDraft,
  MarketplaceListing,
  MarketplacePublisher,
} from '../src/types/marketplace.ts';
import type { SqliteDatabase } from './db.ts';

export interface DiscordIdentity {
  id: string;
  username: string;
  global_name?: string | null;
  avatar: string | null;
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'claw';
}

function shortHash(value: string) {
  return createHash('sha1').update(value).digest('hex').slice(0, 8);
}

function draftSummary(claw: Claw) {
  return claw.intro.length > 180 ? `${claw.intro.slice(0, 177)}...` : claw.intro;
}

function writeBundle(bundlePath: string, bundle: ClawBundle) {
  mkdirSync(dirname(bundlePath), { recursive: true });
  writeFileSync(bundlePath, JSON.stringify(bundle, null, 2));
}

function rowToPublisher(row: Record<string, unknown>): MarketplacePublisher {
  return {
    id: String(row.id),
    discordUserId: String(row.discord_user_id),
    username: String(row.username),
    displayName: String(row.display_name),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    discordHandle: String(row.discord_handle),
    profileUrl: String(row.profile_url),
  };
}

function draftFromRows(row: Record<string, unknown>, publisher: MarketplacePublisher): MarketplaceDraft {
  return {
    id: String(row.id),
    title: String(row.title),
    summary: String(row.summary),
    claw: parseJson<Claw>(String(row.claw_json)),
    publisher,
    manifest: parseJson<ClawBundleManifest>(String(row.manifest_json)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    status: 'draft',
  };
}

function listingFromRows(row: Record<string, unknown>, publisher: MarketplacePublisher): MarketplaceListing {
  const slug = String(row.slug);
  return {
    id: String(row.id),
    slug,
    title: String(row.title),
    summary: String(row.summary),
    claw: parseJson<Claw>(String(row.claw_json)),
    publisher,
    manifest: parseJson<ClawBundleManifest>(String(row.manifest_json)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    publishedAt: String(row.published_at),
    currentVersion: {
      version: Number(row.version),
      publishedAt: String(row.published_at),
    },
    bundleDownloadUrl: `/api/marketplace/listings/${slug}/bundle`,
    claimable: true,
  };
}

export function createMarketplaceStore(db: SqliteDatabase, storageDir: string) {
  const getUserByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const getDraftStmt = db.prepare('SELECT * FROM drafts WHERE id = ?');
  const getListingStmt = db.prepare(`
    SELECT l.id, l.slug, l.title, l.summary, l.created_at, l.updated_at, l.owner_user_id,
           lv.version, lv.claw_json, lv.manifest_json, lv.bundle_path, lv.published_at
    FROM listings l
    JOIN listing_versions lv ON lv.listing_id = l.id AND lv.version = l.current_version
    WHERE l.slug = ?
  `);
  const listListingsStmt = db.prepare(`
    SELECT l.id, l.slug, l.title, l.summary, l.created_at, l.updated_at, l.owner_user_id,
           lv.version, lv.claw_json, lv.manifest_json, lv.bundle_path, lv.published_at
    FROM listings l
    JOIN listing_versions lv ON lv.listing_id = l.id AND lv.version = l.current_version
    ORDER BY lv.published_at DESC
  `);

  function getPublisher(id: string) {
    const row = getUserByIdStmt.get(id) as Record<string, unknown> | undefined;
    return row ? rowToPublisher(row) : null;
  }

  return {
    upsertDiscordUser(identity: DiscordIdentity) {
      const existing = db
        .prepare('SELECT * FROM users WHERE discord_user_id = ?')
        .get(identity.id) as Record<string, unknown> | undefined;
      const now = new Date().toISOString();
      const displayName = identity.global_name?.trim() || identity.username;
      const avatarUrl = identity.avatar
        ? `https://cdn.discordapp.com/avatars/${identity.id}/${identity.avatar}.png`
        : null;
      const discordHandle = `@${identity.username}`;

      if (existing) {
        db.prepare(
          `UPDATE users
           SET username = ?, display_name = ?, avatar_url = ?, discord_handle = ?, profile_url = ?, updated_at = ?
           WHERE id = ?`,
        ).run(
          identity.username,
          displayName,
          avatarUrl,
          discordHandle,
          `https://discord.com/users/${identity.id}`,
          now,
          String(existing.id),
        );
        return getPublisher(String(existing.id));
      }

      const id = randomUUID();
      db.prepare(
        `INSERT INTO users (id, discord_user_id, username, display_name, avatar_url, discord_handle, profile_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        identity.id,
        identity.username,
        displayName,
        avatarUrl,
        discordHandle,
        `https://discord.com/users/${identity.id}`,
        now,
        now,
      );
      return getPublisher(id);
    },

    getUserById(id: string) {
      return getPublisher(id);
    },

    createDraft(params: {
      userId: string;
      claw: Claw;
      manifest: ClawBundleManifest;
    }) {
      const publisher = getPublisher(params.userId);
      if (!publisher) {
        throw new Error('Publisher not found.');
      }

      const id = randomUUID();
      const now = new Date().toISOString();
      const title = params.claw.name;
      const summary = draftSummary(params.claw);
      const bundle: ClawBundle = { manifest: params.manifest, claw: params.claw };
      const bundlePath = resolve(storageDir, 'drafts', `${id}.bundle.json`);
      writeBundle(bundlePath, bundle);

      db.prepare(
        `INSERT INTO drafts (id, user_id, title, summary, claw_json, manifest_json, bundle_path, created_at, updated_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      ).run(
        id,
        params.userId,
        title,
        summary,
        JSON.stringify(params.claw),
        JSON.stringify(params.manifest),
        bundlePath,
        now,
        now,
      );

      return {
        id,
        title,
        summary,
        claw: params.claw,
        publisher,
        manifest: params.manifest,
        createdAt: now,
        updatedAt: now,
        status: 'draft' as const,
      };
    },

    getDraft(id: string) {
      const row = getDraftStmt.get(id) as Record<string, unknown> | undefined;
      if (!row) return null;
      const publisher = getPublisher(String(row.user_id));
      return publisher ? draftFromRows(row, publisher) : null;
    },

    getDraftForUser(id: string, userId: string) {
      const draft = this.getDraft(id);
      return draft?.publisher.id === userId ? draft : null;
    },

    updateDraft(params: {
      id: string;
      userId: string;
      title?: string;
      summary?: string;
      toolsVisibility?: ClawBundleManifest['toolsVisibility'];
      coverStyle?: ClawBundleManifest['coverStyle'];
    }) {
      const current = this.getDraftForUser(params.id, params.userId);
      if (!current) {
        throw new Error('Draft not found.');
      }

      const next: MarketplaceDraft = {
        ...current,
        title: params.title?.trim() ? params.title.trim().slice(0, 80) : current.title,
        summary: params.summary?.trim() ? params.summary.trim().slice(0, 240) : current.summary,
        updatedAt: new Date().toISOString(),
        manifest: {
          ...current.manifest,
          toolsVisibility: params.toolsVisibility ?? current.manifest.toolsVisibility,
          coverStyle: params.coverStyle ?? current.manifest.coverStyle,
        },
      };
      const bundle: ClawBundle = { claw: next.claw, manifest: next.manifest };
      const bundlePath = resolve(storageDir, 'drafts', `${next.id}.bundle.json`);
      writeBundle(bundlePath, bundle);

      db.prepare(
        `UPDATE drafts SET title = ?, summary = ?, manifest_json = ?, bundle_path = ?, updated_at = ? WHERE id = ?`,
      ).run(
        next.title,
        next.summary,
        JSON.stringify(next.manifest),
        bundlePath,
        next.updatedAt,
        next.id,
      );

      return next;
    },

    publishDraft(params: { id: string; userId: string }) {
      const draft = this.getDraftForUser(params.id, params.userId);
      if (!draft) {
        throw new Error('Draft not found.');
      }

      const now = new Date().toISOString();
      const slug = `${slugify(draft.claw.name)}-${shortHash(`${params.userId}:${draft.claw.id}`)}`;
      const existingListing = db
        .prepare('SELECT * FROM listings WHERE slug = ?')
        .get(slug) as Record<string, unknown> | undefined;

      let listingId: string;
      let nextVersion: number;
      if (existingListing) {
        listingId = String(existingListing.id);
        nextVersion = Number(existingListing.current_version) + 1;
        db.prepare('UPDATE listings SET title = ?, summary = ?, updated_at = ?, current_version = ? WHERE id = ?').run(
          draft.title,
          draft.summary,
          now,
          nextVersion,
          listingId,
        );
      } else {
        listingId = randomUUID();
        nextVersion = 1;
        db.prepare(
          `INSERT INTO listings (id, owner_user_id, slug, title, summary, created_at, updated_at, current_version)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(listingId, params.userId, slug, draft.title, draft.summary, now, now, nextVersion);
      }

      const versionId = randomUUID();
      const bundlePath = resolve(storageDir, 'listings', slug, `v${nextVersion}.bundle.json`);
      writeBundle(bundlePath, { claw: draft.claw, manifest: draft.manifest });

      db.prepare(
        `INSERT INTO listing_versions (id, listing_id, draft_id, version, claw_json, manifest_json, bundle_path, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        versionId,
        listingId,
        draft.id,
        nextVersion,
        JSON.stringify(draft.claw),
        JSON.stringify(draft.manifest),
        bundlePath,
        now,
      );

      const listing = this.getListingBySlug(slug);
      if (!listing) {
        throw new Error('Failed to publish listing.');
      }
      return listing;
    },

    listListings() {
      const rows = listListingsStmt.all() as Record<string, unknown>[];
      return rows
        .map((row) => {
          const publisher = getPublisher(String(row.owner_user_id));
          return publisher ? listingFromRows(row, publisher) : null;
        })
        .filter((value): value is MarketplaceListing => Boolean(value));
    },

    getListingBySlug(slug: string) {
      const row = getListingStmt.get(slug) as Record<string, unknown> | undefined;
      if (!row) return null;
      const publisher = getPublisher(String(row.owner_user_id));
      return publisher ? listingFromRows(row, publisher) : null;
    },

    getListingBundlePath(slug: string) {
      const row = getListingStmt.get(slug) as Record<string, unknown> | undefined;
      return row ? String(row.bundle_path) : null;
    },
  };
}
