import type { Claw } from './claw';

export interface MarketplacePublisher {
  id: string;
  discordUserId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  discordHandle: string;
  profileUrl: string;
}

export interface ClawBundleManifest {
  bundleVersion: number;
  source: 'openclaw-workspace-zip' | 'clawpark-export';
  includedFiles: string[];
  ignoredFiles: string[];
  warnings: string[];
  generatedAt: string;
  toolsVisibility: 'full' | 'summary';
  coverStyle: 'avatar' | 'containment-card';
}

export interface ClawBundle {
  manifest: ClawBundleManifest;
  claw: Claw;
}

export interface MarketplaceDraft {
  id: string;
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

export interface MarketplaceListing {
  id: string;
  slug: string;
  title: string;
  summary: string;
  claw: Claw;
  publisher: MarketplacePublisher;
  manifest: ClawBundleManifest;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  currentVersion: MarketplaceListingVersion;
  bundleDownloadUrl: string;
  claimable: boolean;
}

export interface MarketplaceSession {
  user: MarketplacePublisher | null;
  authConfigured: boolean;
}
