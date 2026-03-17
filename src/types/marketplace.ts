import type { Claw } from './claw';

export type MarketplaceListingKind = 'claw' | 'skill';
export type MarketplaceListingTrust = 'verified' | 'unsigned';
export type MarketplacePublisherKind = 'discord' | 'unsigned';
export type MarketplacePublisherMode = 'discord-session' | 'local-skill';

export interface MarketplacePublisher {
  id: string;
  kind: MarketplacePublisherKind;
  displayName: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  discordUserId?: string | null;
  username?: string | null;
  discordHandle?: string | null;
}

export interface ClawBundleManifest {
  kind: 'claw';
  bundleVersion: number;
  source: 'openclaw-workspace-zip' | 'clawpark-export' | 'openclaw-local-skill';
  includedFiles: string[];
  ignoredFiles: string[];
  warnings: string[];
  generatedAt: string;
  toolsVisibility: 'full' | 'summary';
  coverStyle: 'avatar' | 'containment-card';
}

export interface PublishedSkill {
  slug: string;
  name: string;
  description: string;
  summary: string;
  entrypoint: string;
  scriptFiles: string[];
  assetFiles: string[];
  referenceFiles: string[];
}

export interface SkillBundleManifest {
  kind: 'skill';
  bundleVersion: number;
  source: 'openclaw-skill-zip' | 'clawpark-export' | 'openclaw-local-skill';
  includedFiles: string[];
  ignoredFiles: string[];
  warnings: string[];
  generatedAt: string;
  entrypoint: string;
  scriptFiles: string[];
  assetFiles: string[];
  referenceFiles: string[];
}

export interface ClawBundle {
  kind: 'claw';
  manifest: ClawBundleManifest;
  claw: Claw;
}

export interface SkillBundle {
  kind: 'skill';
  manifest: SkillBundleManifest;
  skill: PublishedSkill;
}

export type MarketplaceBundle = ClawBundle | SkillBundle;

export interface MarketplaceDraft {
  id: string;
  kind: 'claw';
  title: string;
  summary: string;
  claw: Claw;
  publisher: MarketplacePublisher;
  manifest: ClawBundleManifest;
  createdAt: string;
  updatedAt: string;
  status: 'draft';
}

export interface MarketplaceListingVersion {
  version: number;
  publishedAt: string;
}

interface MarketplaceListingBase {
  id: string;
  slug: string;
  kind: MarketplaceListingKind;
  trust: MarketplaceListingTrust;
  publisherMode: MarketplacePublisherMode;
  title: string;
  summary: string;
  publisher: MarketplacePublisher;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  currentVersion: MarketplaceListingVersion;
  bundleDownloadUrl: string;
  claimable: boolean;
}

export interface MarketplaceClawListing extends MarketplaceListingBase {
  kind: 'claw';
  claw: Claw;
  manifest: ClawBundleManifest;
  claimable: true;
}

export interface MarketplaceSkillListing extends MarketplaceListingBase {
  kind: 'skill';
  skill: PublishedSkill;
  manifest: SkillBundleManifest;
  claimable: false;
  installHint: string;
}

export type MarketplaceListing = MarketplaceClawListing | MarketplaceSkillListing;

export interface MarketplaceSession {
  user: MarketplacePublisher | null;
  authConfigured: boolean;
}

export interface MarketplaceSkillInstallResult {
  ok: true;
  slug: string;
  skillSlug: string;
  installedPath: string;
  overwritten: boolean;
}
