import { SKILL_BADGE_BY_ID } from '../data/skillBadges';
import { SOUL_TRAIT_BY_ID } from '../data/soulTraits';
import { TOOL_BADGE_BY_ID } from '../data/toolBadges';
import type { Claw, ClawIdentity, ClawVisual } from '../types/claw';
import type {
  ClawBundleManifest,
  MarketplaceClawListing,
  MarketplaceListing,
  MarketplacePublisher,
  MarketplaceSkillListing,
  PublishedSkill,
  SkillBundleManifest,
} from '../types/marketplace';

export const MARKETPLACE_SEED_FIXTURE_ROOT = 'integrations/openclaw-marketplace-examples';

export const MARKETPLACE_SEED_FIXTURES = {
  meridianClaw: `${MARKETPLACE_SEED_FIXTURE_ROOT}/meridian-claw`,
  parkAuditSkill: `${MARKETPLACE_SEED_FIXTURE_ROOT}/park-audit-skill`,
  containmentLaunchSkill: `${MARKETPLACE_SEED_FIXTURE_ROOT}/containment-launch-skill`,
} as const;

const seedWarning = 'Seed listing shown because the marketplace API is not available.';
const baseDate = new Date('2026-03-10T00:00:00.000Z').toISOString();

const verifiedPublisher: MarketplacePublisher = {
  id: 'seed-publisher-docs',
  kind: 'discord',
  displayName: 'OpenClaw Docs Demo',
  avatarUrl: null,
  profileUrl: 'https://discord.com',
  discordUserId: 'openclaw-docs-demo',
  username: 'openclaw-docs-demo',
  discordHandle: '@openclaw-docs-demo',
};

function buildVisual(
  primaryColor: string,
  secondaryColor: string,
  modifierIds: string[],
  pattern: ClawVisual['pattern'],
  glowIntensity = 0.52,
): ClawVisual {
  return {
    primaryColor,
    secondaryColor,
    shapeModifiers: modifierIds.map((id) => SOUL_TRAIT_BY_ID[id].visualSymbol.shapeModifier),
    pattern,
    glowIntensity,
  };
}

function buildIdentity(identity: Omit<ClawIdentity, 'role'>, role: string): ClawIdentity {
  return { ...identity, role };
}

function buildTools(ids: string[]) {
  return {
    loadout: ids.map((id) => TOOL_BADGE_BY_ID[id]).filter(Boolean),
  };
}

function createUnsignedPublisher(id: string, displayName: string): MarketplacePublisher {
  return {
    id,
    kind: 'unsigned',
    displayName,
    avatarUrl: null,
    profileUrl: null,
  };
}

function localSeedWarnings(fixturePath: string, extraWarnings: string[] = []) {
  return [seedWarning, `Local example fixture: ${fixturePath}`, ...extraWarnings];
}

function baseClawManifest(includedFiles: string[], fixturePath: string): ClawBundleManifest {
  return {
    kind: 'claw',
    bundleVersion: 1,
    source: 'openclaw-workspace-zip',
    includedFiles,
    ignoredFiles: [],
    warnings: localSeedWarnings(fixturePath),
    generatedAt: baseDate,
    toolsVisibility: 'full',
    coverStyle: 'avatar',
  };
}

function buildSkillManifest(skill: PublishedSkill, fixturePath: string): SkillBundleManifest {
  return {
    kind: 'skill',
    bundleVersion: 1,
    source: 'openclaw-skill-zip',
    includedFiles: [skill.entrypoint, ...skill.scriptFiles, ...skill.assetFiles, ...skill.referenceFiles],
    ignoredFiles: [],
    warnings: localSeedWarnings(fixturePath),
    generatedAt: baseDate,
    entrypoint: skill.entrypoint,
    scriptFiles: skill.scriptFiles,
    assetFiles: skill.assetFiles,
    referenceFiles: skill.referenceFiles,
  };
}

const meridianClaw: Claw = {
  id: 'market-meridian-001',
  name: 'Meridian',
  archetype: 'The Cartographer',
  generation: 0,
  identity: buildIdentity(
    {
      creature: 'Compass Parasaurolophus',
      directive: 'Map every boundary in the enclosure and keep operators aligned on the next safe route.',
      vibe: 'Methodical · Watchful',
      emoji: '🧭',
    },
    'The Cartographer',
  ),
  soul: {
    traits: [
      SOUL_TRAIT_BY_ID['trait-analysis'],
      SOUL_TRAIT_BY_ID['trait-documentation'],
      SOUL_TRAIT_BY_ID['trait-caution'],
    ],
  },
  skills: {
    badges: [
      SKILL_BADGE_BY_ID['skill-strategy'],
      SKILL_BADGE_BY_ID['skill-review'],
      SKILL_BADGE_BY_ID['skill-vision'],
    ],
  },
  tools: buildTools(['tool-radar-array', 'tool-seer-lens', 'tool-workflow-grid']),
  visual: buildVisual('#7fd7ff', '#d6ff9a', ['trait-analysis', 'trait-documentation', 'trait-caution'], 'gradient', 0.58),
  intro: 'Meridian turns scattered observations into durable field guidance, handoff notes, and navigable next steps.',
  lineage: null,
};

const meridianListing: MarketplaceClawListing = {
  id: 'seed-claw-meridian',
  slug: 'meridian-demo',
  kind: 'claw',
  trust: 'verified',
  publisherMode: 'discord-session',
  title: meridianClaw.name,
  summary: meridianClaw.intro,
  claw: meridianClaw,
  publisher: verifiedPublisher,
  manifest: baseClawManifest(
    ['IDENTITY.md', 'SOUL.md', 'TOOLS.md', 'skills/field-notes/SKILL.md'],
    MARKETPLACE_SEED_FIXTURES.meridianClaw,
  ),
  createdAt: baseDate,
  updatedAt: baseDate,
  publishedAt: baseDate,
  currentVersion: {
    version: 1,
    publishedAt: baseDate,
  },
  bundleDownloadUrl: '',
  claimable: true,
};

const seedSkills: Array<{
  id: string;
  slug: string;
  publisherId: string;
  publisherName: string;
  installHint: string;
  fixturePath: string;
  skill: PublishedSkill;
}> = [
  {
    id: 'seed-skill-park-audit',
    slug: 'park-audit-demo',
    publisherId: 'seed-skill-publisher-park-audit',
    publisherName: 'Local Park Audit Publisher',
    installHint: 'Install into ./skills/park-audit',
    fixturePath: MARKETPLACE_SEED_FIXTURES.parkAuditSkill,
    skill: {
      slug: 'park-audit',
      name: 'Park Audit',
      description: 'Scan an enclosure for broken assumptions, unsafe releases, and missing evidence.',
      summary: 'Review-heavy skill that surfaces risks, trust gaps, and the smallest safe next step.',
      entrypoint: 'SKILL.md',
      scriptFiles: ['scripts/park_audit.py'],
      assetFiles: [],
      referenceFiles: ['references/checklist.md'],
    },
  },
  {
    id: 'seed-skill-containment-launch',
    slug: 'containment-launch-demo',
    publisherId: 'seed-skill-publisher-containment-launch',
    publisherName: 'Local Containment Publisher',
    installHint: 'Install into ./skills/containment-launch',
    fixturePath: MARKETPLACE_SEED_FIXTURES.containmentLaunchSkill,
    skill: {
      slug: 'containment-launch',
      name: 'Containment Launch',
      description: 'Turn a draft release into a monitored launch checklist with smoke checks and rollback notes.',
      summary: 'Bundles launch gates, smoke checks, rollback readiness, and operator handoff notes.',
      entrypoint: 'SKILL.md',
      scriptFiles: ['scripts/release_gate.sh'],
      assetFiles: ['assets/release-card.txt'],
      referenceFiles: [],
    },
  },
];

const seedSkillListings: MarketplaceSkillListing[] = seedSkills.map((entry) => ({
  id: entry.id,
  slug: entry.slug,
  kind: 'skill',
  trust: 'unsigned',
  publisherMode: 'local-skill',
  title: entry.skill.name,
  summary: entry.skill.summary,
  skill: entry.skill,
  publisher: createUnsignedPublisher(entry.publisherId, entry.publisherName),
  manifest: buildSkillManifest(entry.skill, entry.fixturePath),
  createdAt: baseDate,
  updatedAt: baseDate,
  publishedAt: baseDate,
  currentVersion: {
    version: 1,
    publishedAt: baseDate,
  },
  bundleDownloadUrl: '',
  claimable: false,
  installHint: entry.installHint,
}));

export const MARKETPLACE_SEED_LISTINGS: MarketplaceListing[] = [meridianListing, ...seedSkillListings];
