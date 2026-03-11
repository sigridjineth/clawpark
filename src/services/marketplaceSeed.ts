import { MARKETPLACE_CLAWS } from '../data/marketplaceClaws';
import type { MarketplaceListing, MarketplacePublisher } from '../types/marketplace';

const seedPublisher: MarketplacePublisher = {
  id: 'seed-publisher',
  discordUserId: 'seed-publisher',
  username: 'clawpark-lab',
  displayName: 'ClawPark Lab',
  avatarUrl: null,
  discordHandle: '@clawpark-lab',
  profileUrl: 'https://discord.com',
};

export const MARKETPLACE_SEED_LISTINGS: MarketplaceListing[] = MARKETPLACE_CLAWS.map((claw, index) => ({
  id: `seed-${index + 1}`,
  slug: `${claw.name.toLowerCase()}-${index + 1}`,
  title: claw.name,
  summary: claw.intro,
  claw,
  publisher: seedPublisher,
  manifest: {
    bundleVersion: 1,
    source: 'clawpark-export',
    includedFiles: ['claw.json'],
    ignoredFiles: [],
    warnings: ['Seed listing shown because the marketplace API is not available.'],
    generatedAt: new Date('2026-03-10T00:00:00.000Z').toISOString(),
    toolsVisibility: 'full',
    coverStyle: 'avatar',
  },
  createdAt: new Date('2026-03-10T00:00:00.000Z').toISOString(),
  updatedAt: new Date('2026-03-10T00:00:00.000Z').toISOString(),
  publishedAt: new Date('2026-03-10T00:00:00.000Z').toISOString(),
  currentVersion: {
    version: 1,
    publishedAt: new Date('2026-03-10T00:00:00.000Z').toISOString(),
  },
  bundleDownloadUrl: '',
  claimable: true,
}));
