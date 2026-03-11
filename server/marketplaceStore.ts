import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import type { Claw } from '../src/types/claw.ts';
import type {
  ClawBundle,
  ClawBundleManifest,
  MarketplaceDraft,
  MarketplaceListing,
  MarketplacePublisher,
  MarketplacePublisherMode,
  MarketplacePublisherKind,
  PublishedSkill,
  SkillBundle,
  SkillBundleManifest,
} from '../src/types/marketplace.ts';
import type { SqliteDatabase } from './db.ts';

export interface DiscordIdentity {
  id: string;
  username: string;
  global_name?: string | null;
  avatar: string | null;
}

export interface StoredArtifact {
  path: string;
  filename: string;
  contentType: string;
}

type ListingContent =
  | { kind: 'claw'; value: Claw; manifest: ClawBundleManifest }
  | { kind: 'skill'; value: PublishedSkill; manifest: SkillBundleManifest; installHint: string };

type ListingRow = Record<string, unknown>;

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'claw'
  );
}

function shortHash(value: string) {
  return createHash('sha1').update(value).digest('hex').slice(0, 8);
}

function draftSummary(claw: Claw) {
  return claw.intro.length > 180 ? `${claw.intro.slice(0, 177)}...` : claw.intro;
}

function writeFileArtifact(path: string, data: string | Buffer) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
}

function writeJsonBundle(bundlePath: string, bundle: ClawBundle | SkillBundle) {
  writeFileArtifact(bundlePath, JSON.stringify(bundle, null, 2));
}

function rowToPublisher(row: ListingRow): MarketplacePublisher {
  const kind = (String(row.auth_kind || 'discord') as MarketplacePublisherKind);
  return {
    id: String(row.id),
    kind,
    displayName: String(row.display_name),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    profileUrl: kind === 'discord' ? String(row.profile_url) : null,
    discordUserId: kind === 'discord' ? String(row.discord_user_id) : null,
    username: kind === 'discord' ? String(row.username) : null,
    discordHandle: kind === 'discord' ? String(row.discord_handle) : null,
  };
}

function bundleUrl(slug: string) {
  return `/api/marketplace/listings/${slug}/bundle`;
}

function listingFromRows(row: ListingRow, publisher: MarketplacePublisher): MarketplaceListing {
  const slug = String(row.slug);
  const kind = String(row.kind) as MarketplaceListing['kind'];
  const trust = String(row.trust) as MarketplaceListing['trust'];
  const publisherMode = String(row.publisher_mode) as MarketplacePublisherMode;
  const base = {
    id: String(row.id),
    slug,
    kind,
    trust,
    publisherMode,
    title: String(row.title),
    summary: String(row.summary),
    publisher,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    publishedAt: String(row.published_at),
    currentVersion: {
      version: Number(row.version),
      publishedAt: String(row.published_at),
    },
    bundleDownloadUrl: bundleUrl(slug),
  };

  if (kind === 'skill') {
    return {
      ...base,
      kind: 'skill',
      skill: parseJson<PublishedSkill>(String(row.claw_json)),
      manifest: parseJson<SkillBundleManifest>(String(row.manifest_json)),
      claimable: false,
      installHint: row.install_hint ? String(row.install_hint) : 'Download and install into your OpenClaw skills directory.',
    };
  }

  return {
    ...base,
    kind: 'claw',
    claw: parseJson<Claw>(String(row.claw_json)),
    manifest: parseJson<ClawBundleManifest>(String(row.manifest_json)),
    claimable: true,
  };
}

function listingSelect(whereClause = '') {
  return `
    SELECT l.id, l.slug, l.kind, l.trust, l.publisher_mode, l.install_hint, l.title, l.summary,
           l.created_at, l.updated_at, l.owner_user_id,
           lv.version, lv.claw_json, lv.manifest_json, lv.bundle_path, lv.published_at
    FROM listings l
    JOIN listing_versions lv ON lv.listing_id = l.id AND lv.version = l.current_version
    ${whereClause}
  `;
}

function artifactFilename(slug: string, extension: string) {
  return `${slug}${extension}`;
}

export function createMarketplaceStore(db: SqliteDatabase, storageDir: string) {
  const getUserByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const getDraftStmt = db.prepare('SELECT * FROM drafts WHERE id = ?');
  const getListingStmt = db.prepare(`${listingSelect('WHERE l.slug = ?')}`);
  const listListingsStmt = db.prepare(`${listingSelect('ORDER BY lv.published_at DESC')}`);

  function getPublisher(id: string) {
    const row = getUserByIdStmt.get(id) as ListingRow | undefined;
    return row ? rowToPublisher(row) : null;
  }

  function getOrCreateUnsignedPublisher(label: string) {
    const displayName = label.trim().slice(0, 80) || 'Unsigned Publisher';
    const identityKey = `unsigned:${shortHash(displayName.toLowerCase())}`;
    const existing = db.prepare('SELECT * FROM users WHERE discord_user_id = ?').get(identityKey) as ListingRow | undefined;
    const now = new Date().toISOString();

    if (existing) {
      db.prepare('UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?').run(displayName, now, String(existing.id));
      return getPublisher(String(existing.id));
    }

    const id = randomUUID();
    db.prepare(
      `INSERT INTO users (id, discord_user_id, username, display_name, avatar_url, discord_handle, profile_url, created_at, updated_at, auth_kind)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'unsigned')`,
    ).run(
      id,
      identityKey,
      slugify(displayName),
      displayName,
      null,
      displayName,
      'local://unsigned-publisher',
      now,
      now,
    );
    return getPublisher(id);
  }

  function draftFromRows(row: ListingRow, publisher: MarketplacePublisher): MarketplaceDraft {
    return {
      id: String(row.id),
      kind: 'claw',
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

  function getListingBySlugInternal(slug: string) {
    const row = getListingStmt.get(slug) as ListingRow | undefined;
    if (!row) return null;
    const publisher = getPublisher(String(row.owner_user_id));
    return publisher ? listingFromRows(row, publisher) : null;
  }

  function insertListing(params: {
    ownerUserId: string;
    kind: MarketplaceListing['kind'];
    trust: MarketplaceListing['trust'];
    publisherMode: MarketplacePublisherMode;
    title: string;
    summary: string;
    slug: string;
    contentJson: string;
    manifestJson: string;
    bundlePath: string;
    installHint?: string | null;
    draftId?: string | null;
    allowVersioning: boolean;
  }) {
    const now = new Date().toISOString();
    const existingListing = params.allowVersioning
      ? (db.prepare('SELECT * FROM listings WHERE slug = ?').get(params.slug) as ListingRow | undefined)
      : undefined;

    let listingId: string;
    let nextVersion: number;
    if (existingListing) {
      listingId = String(existingListing.id);
      nextVersion = Number(existingListing.current_version) + 1;
      db.prepare(
        'UPDATE listings SET title = ?, summary = ?, updated_at = ?, current_version = ?, kind = ?, trust = ?, publisher_mode = ?, install_hint = ? WHERE id = ?',
      ).run(
        params.title,
        params.summary,
        now,
        nextVersion,
        params.kind,
        params.trust,
        params.publisherMode,
        params.installHint ?? null,
        listingId,
      );
    } else {
      listingId = randomUUID();
      nextVersion = 1;
      db.prepare(
        `INSERT INTO listings (id, owner_user_id, slug, kind, trust, publisher_mode, install_hint, title, summary, created_at, updated_at, current_version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        listingId,
        params.ownerUserId,
        params.slug,
        params.kind,
        params.trust,
        params.publisherMode,
        params.installHint ?? null,
        params.title,
        params.summary,
        now,
        now,
        nextVersion,
      );
    }

    db.prepare(
      `INSERT INTO listing_versions (id, listing_id, draft_id, version, claw_json, manifest_json, bundle_path, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      randomUUID(),
      listingId,
      params.draftId ?? null,
      nextVersion,
      params.contentJson,
      params.manifestJson,
      params.bundlePath,
      now,
    );

    return getListingBySlugInternal(params.slug);
  }

  return {
    upsertDiscordUser(identity: DiscordIdentity) {
      const existing = db.prepare('SELECT * FROM users WHERE discord_user_id = ?').get(identity.id) as ListingRow | undefined;
      const now = new Date().toISOString();
      const displayName = identity.global_name?.trim() || identity.username;
      const avatarUrl = identity.avatar
        ? `https://cdn.discordapp.com/avatars/${identity.id}/${identity.avatar}.png`
        : null;
      const discordHandle = `@${identity.username}`;

      if (existing) {
        db.prepare(
          `UPDATE users
           SET username = ?, display_name = ?, avatar_url = ?, discord_handle = ?, profile_url = ?, updated_at = ?, auth_kind = 'discord'
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
        `INSERT INTO users (id, discord_user_id, username, display_name, avatar_url, discord_handle, profile_url, created_at, updated_at, auth_kind)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'discord')`,
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

    createDraft(params: { userId: string; claw: Claw; manifest: ClawBundleManifest }) {
      const publisher = getPublisher(params.userId);
      if (!publisher) {
        throw new Error('Publisher not found.');
      }

      const id = randomUUID();
      const now = new Date().toISOString();
      const title = params.claw.name;
      const summary = draftSummary(params.claw);
      const bundle: ClawBundle = { kind: 'claw', manifest: params.manifest, claw: params.claw };
      const bundlePath = resolve(storageDir, 'drafts', `${id}.bundle.json`);
      writeJsonBundle(bundlePath, bundle);

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
        kind: 'claw' as const,
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
      const row = getDraftStmt.get(id) as ListingRow | undefined;
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
      const bundle: ClawBundle = { kind: 'claw', claw: next.claw, manifest: next.manifest };
      const bundlePath = resolve(storageDir, 'drafts', `${next.id}.bundle.json`);
      writeJsonBundle(bundlePath, bundle);

      db.prepare(
        `UPDATE drafts SET title = ?, summary = ?, manifest_json = ?, bundle_path = ?, updated_at = ? WHERE id = ?`,
      ).run(next.title, next.summary, JSON.stringify(next.manifest), bundlePath, next.updatedAt, next.id);

      return next;
    },

    publishDraft(params: { id: string; userId: string }) {
      const draft = this.getDraftForUser(params.id, params.userId);
      if (!draft) {
        throw new Error('Draft not found.');
      }

      const slug = `${slugify(draft.claw.name)}-${shortHash(`${params.userId}:${draft.claw.id}`)}`;
      const bundlePath = resolve(storageDir, 'listings', slug, 'v1.bundle.json');
      writeJsonBundle(bundlePath, { kind: 'claw', claw: draft.claw, manifest: draft.manifest });

      return insertListing({
        ownerUserId: params.userId,
        kind: 'claw',
        trust: 'verified',
        publisherMode: 'discord-session',
        title: draft.title,
        summary: draft.summary,
        slug,
        contentJson: JSON.stringify(draft.claw),
        manifestJson: JSON.stringify(draft.manifest),
        bundlePath,
        draftId: draft.id,
        allowVersioning: true,
      });
    },

    createUnsignedListing(params: {
      publisherLabel: string;
      listing: ListingContent;
      title?: string;
      summary?: string;
      artifact?: { bytes: Buffer; extension: string; contentType: string };
    }) {
      const publisher = getOrCreateUnsignedPublisher(params.publisherLabel);
      if (!publisher) {
        throw new Error('Failed to allocate unsigned publisher.');
      }

      const baseTitle = params.title?.trim() || (params.listing.kind === 'claw' ? params.listing.value.name : params.listing.value.name);
      const baseSummary =
        params.summary?.trim() ||
        (params.listing.kind === 'claw' ? draftSummary(params.listing.value) : params.listing.value.summary);
      const slug = `${slugify(baseTitle)}-${shortHash(`${publisher.id}:${baseTitle}:${Date.now()}`)}`;
      const bundleExtension = params.artifact?.extension ?? '.bundle.json';
      const bundlePath = resolve(storageDir, 'listings', slug, `v1${bundleExtension}`);

      if (params.artifact) {
        writeFileArtifact(bundlePath, params.artifact.bytes);
      } else if (params.listing.kind === 'claw') {
        writeJsonBundle(bundlePath, { kind: 'claw', claw: params.listing.value, manifest: params.listing.manifest });
      } else {
        writeJsonBundle(bundlePath, { kind: 'skill', skill: params.listing.value, manifest: params.listing.manifest });
      }

      return insertListing({
        ownerUserId: publisher.id,
        kind: params.listing.kind,
        trust: 'unsigned',
        publisherMode: 'local-skill',
        title: baseTitle.slice(0, 80),
        summary: baseSummary.slice(0, 240),
        slug,
        contentJson: JSON.stringify(params.listing.value),
        manifestJson: JSON.stringify(params.listing.manifest),
        bundlePath,
        installHint: params.listing.kind === 'skill' ? params.listing.installHint : null,
        allowVersioning: false,
      });
    },

    listListings() {
      const rows = listListingsStmt.all() as ListingRow[];
      return rows
        .map((row) => {
          const publisher = getPublisher(String(row.owner_user_id));
          return publisher ? listingFromRows(row, publisher) : null;
        })
        .filter((value): value is MarketplaceListing => Boolean(value));
    },

    getListingBySlug(slug: string) {
      return getListingBySlugInternal(slug);
    },

    getListingArtifact(slug: string): StoredArtifact | null {
      const row = getListingStmt.get(slug) as ListingRow | undefined;
      if (!row) return null;
      const kind = String(row.kind) as MarketplaceListing['kind'];
      const path = String(row.bundle_path);
      const extension = extname(path) || (kind === 'skill' ? '.zip' : '.json');
      return {
        path,
        filename: artifactFilename(slug, extension),
        contentType: extension === '.zip' ? 'application/zip' : 'application/json; charset=utf-8',
      };
    },
  };
}
