import { execFile as execFileCallback } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';
import { SKILL_BADGES } from '../src/data/skillBadges.ts';
import { SOUL_TRAITS } from '../src/data/soulTraits.ts';
import { TOOL_BADGES } from '../src/data/toolBadges.ts';
import { getClawIdentity, getClawTools, summarizeSkills, summarizeSoul, summarizeTools } from '../src/engine/openclaw.ts';
import type { Claw, ClawIdentity, ClawVisual, SkillBadge, SoulTrait } from '../src/types/claw.ts';
import type { ClawBundleManifest, PublishedSkill, SkillBundleManifest } from '../src/types/marketplace.ts';

const execFile = promisify(execFileCallback);
const PATTERNS: ClawVisual['pattern'][] = ['solid', 'gradient', 'stripe', 'dot', 'wave'];
const CLAW_ALLOWLIST = ['IDENTITY.md', 'SOUL.md', 'TOOLS.md'];
const SKILL_ALLOWLIST = [/^SKILL\.md$/i, /^README\.md$/i, /^scripts\//i, /^assets\//i, /^references\//i];
const DENYLIST_PATTERNS = [/^AGENTS\.md$/i, /^USER\.md$/i, /^MEMORY\.md$/i, /^memory\//i, /^\.env/i, /^logs\//i, /\.sqlite$/i, /^\.git\//i, /(^|\/)node_modules\//i];

const SOUL_KEYWORDS: Record<string, string[]> = {
  'trait-caution': ['caution', 'careful', 'safe', 'verify', 'boundary', 'guardrail', 'risk'],
  'trait-curiosity': ['curious', 'explore', 'discover', 'search', 'probe', 'question'],
  'trait-critique': ['critique', 'review', 'challenge', 'skeptic', 'audit', 'red-team'],
  'trait-documentation': ['document', 'write down', 'spec', 'notes', 'record', 'trace'],
  'trait-prototyping': ['prototype', 'ship fast', 'iterate', 'sketch', 'build quickly'],
  'trait-improvisation': ['improvise', 'adapt', 'pivot', 'instinct', 'flex', 'wildcard'],
  'trait-analysis': ['analyze', 'analysis', 'reason', 'pattern', 'diagnose', 'investigate'],
  'trait-creativity': ['creative', 'invent', 'story', 'design', 'imagine', 'novel'],
  'trait-systems': ['system', 'architecture', 'workflow', 'orchestrate', 'process', 'pipeline'],
};

const SKILL_KEYWORDS: Record<string, string[]> = {
  'skill-review': ['review', 'inspect', 'critique', 'pull request', 'quality'],
  'skill-strategy': ['architecture', 'strategy', 'system design', 'planning', 'workflow'],
  'skill-prompting': ['prompt', 'promptcraft', 'instruction', 'agent prompt', 'system prompt'],
  'skill-testing': ['test', 'qa', 'validate', 'assertion', 'regression'],
  'skill-animation': ['motion', 'animation', 'transition', 'framer', 'visual polish'],
  'skill-story': ['story', 'narrative', 'writing', 'copy', 'voice'],
  'skill-security': ['security', 'sandbox', 'threat', 'auth', 'secret'],
  'skill-debug': ['debug', 'fix', 'trace', 'bug', 'diagnostic'],
  'skill-vision': ['vision', 'image', 'figma', 'visual', 'screenshot'],
  'skill-velocity': ['speed', 'ship', 'launch', 'prototype', 'velocity'],
};

const TOOL_IDS_BY_SKILL: Record<string, string[]> = {
  'skill-review': ['tool-search-probe', 'tool-seer-lens'],
  'skill-strategy': ['tool-workflow-grid', 'tool-radar-array'],
  'skill-prompting': ['tool-spark-injector', 'tool-orbit-board'],
  'skill-testing': ['tool-sandbox-ward', 'tool-search-probe'],
  'skill-animation': ['tool-forge-armature', 'tool-orbit-board'],
  'skill-story': ['tool-forge-armature', 'tool-spark-injector'],
  'skill-security': ['tool-sandbox-ward', 'tool-radar-array'],
  'skill-debug': ['tool-search-probe', 'tool-seer-lens'],
  'skill-vision': ['tool-radar-array', 'tool-seer-lens'],
  'skill-velocity': ['tool-launch-rail', 'tool-forge-armature'],
};

const TOOL_KEYWORDS: Record<string, string[]> = {
  'tool-search-probe': ['search', 'grep', 'query', 'look up', 'probe'],
  'tool-workflow-grid': ['workflow', 'pipeline', 'task', 'plan', 'orchestrate'],
  'tool-spark-injector': ['spark', 'brainstorm', 'prompt', 'ideate'],
  'tool-sandbox-ward': ['sandbox', 'safe', 'guard', 'validate', 'security'],
  'tool-orbit-board': ['board', 'coordination', 'collaboration', 'team'],
  'tool-seer-lens': ['vision', 'observe', 'inspect', 'see', 'lens'],
  'tool-forge-armature': ['forge', 'prototype', 'shape', 'generate', 'craft'],
  'tool-launch-rail': ['launch', 'deploy', 'ship', 'release'],
  'tool-radar-array': ['radar', 'monitor', 'scan', 'watch', 'signal'],
};

function shortHash(input: string) {
  return createHash('sha1').update(input).digest('hex').slice(0, 10);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function normalizePath(value: string) {
  return value.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\//, '');
}

function isDeniedPath(path: string) {
  return DENYLIST_PATTERNS.some((pattern) => pattern.test(path));
}

function tokenize(value: string) {
  return value.toLowerCase();
}

function scoreKeywords(text: string, keywords: string[]) {
  const haystack = tokenize(text);
  return keywords.reduce((sum, keyword) => sum + (haystack.includes(keyword.toLowerCase()) ? 1 : 0), 0);
}

function rankByKeywords<T extends { id: string }>(items: T[], text: string, keywordMap: Record<string, string[]>, limit: number) {
  return items
    .map((item) => ({ item, score: scoreKeywords(text, keywordMap[item.id] ?? []) }))
    .sort((left, right) => right.score - left.score)
    .filter((entry) => entry.score > 0)
    .slice(0, limit)
    .map((entry) => entry.item);
}

function stripMarkdown(value: string) {
  return value
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, ' ')
    .replace(/[*_>#-]+/g, ' ')
    .replace(/\[[^\]]+\]\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFrontmatter(markdown: string) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {} as Record<string, string>;
  const result: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (!key || rest.length === 0) continue;
    result[key.trim().toLowerCase()] = rest.join(':').trim().replace(/^['"]|['"]$/g, '');
  }
  return result;
}

function findField(markdown: string, labels: string[]) {
  for (const label of labels) {
    const regex = new RegExp(`(?:^|\\n)(?:[-*]\\s*)?(?:\\*\\*)?${label}(?:\\*\\*)?\\s*[:|-]\\s*(.+)`, 'i');
    const match = markdown.match(regex);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function firstHeading(markdown: string) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

function firstParagraph(markdown: string) {
  const parts = markdown
    .split(/\n\s*\n/)
    .map((part) => stripMarkdown(part))
    .filter(Boolean);
  return parts[0] ?? null;
}

function extractEmoji(value: string) {
  const match = value.match(/\p{Extended_Pictographic}/u);
  return match?.[0] ?? null;
}

function sanitizeIdentityValue(value: string | null | undefined) {
  const normalized = value?.trim().replace(/^['"]|['"]$/g, '') ?? '';
  if (!normalized) return null;
  if (!/[A-Za-z0-9가-힣]/.test(normalized)) return null;
  if (/^\*+$/.test(normalized)) return null;
  if (/pick something you like|fill this in|who am i|todo|tbd/i.test(normalized)) return null;
  return normalized;
}

function buildVisual(name: string, soulTraits: SoulTrait[], skills: SkillBadge[]): ClawVisual {
  const hash = shortHash(`${name}:${soulTraits.map((trait) => trait.id).join(',')}:${skills.map((skill) => skill.id).join(',')}`);
  const primaryColor = skills[0]?.color ?? soulTraits[0]?.color ?? '#f2d176';
  const secondaryColor = soulTraits[0]?.color ?? skills[0]?.color ?? '#8dd3ff';
  const glowSeed = parseInt(hash.slice(0, 2), 16) / 255;
  const pattern = PATTERNS[parseInt(hash.slice(2, 4), 16) % PATTERNS.length];

  return {
    primaryColor,
    secondaryColor,
    shapeModifiers: soulTraits.map((trait) => trait.visualSymbol.shapeModifier),
    pattern,
    glowIntensity: 0.35 + glowSeed * 0.4,
  };
}

function fallbackSoulTraits(text: string) {
  const ranked = rankByKeywords(SOUL_TRAITS, text, SOUL_KEYWORDS, 3);
  return ranked.length > 0 ? ranked : [SOUL_TRAITS[6], SOUL_TRAITS[0], SOUL_TRAITS[3]];
}

function fallbackSkillBadges(text: string, soulTraits: SoulTrait[]) {
  const ranked = rankByKeywords(SKILL_BADGES, text, SKILL_KEYWORDS, 3);
  if (ranked.length > 0) return ranked;

  const joined = soulTraits.map((trait) => trait.id).join(',');
  if (joined.includes('trait-analysis')) return [SKILL_BADGES[0], SKILL_BADGES[3], SKILL_BADGES[8]];
  if (joined.includes('trait-prototyping')) return [SKILL_BADGES[9], SKILL_BADGES[2], SKILL_BADGES[4]];
  return [SKILL_BADGES[0], SKILL_BADGES[1], SKILL_BADGES[3]];
}

function deriveToolLoadout(skills: SkillBadge[]) {
  const preferredIds = skills.flatMap((badge) => TOOL_IDS_BY_SKILL[badge.id] ?? []);
  const uniqueIds = Array.from(new Set(preferredIds));
  const fallbackIds = ['tool-radar-array', 'tool-sandbox-ward', 'tool-search-probe'];

  return [...uniqueIds, ...fallbackIds]
    .slice(0, 3)
    .map((id) => TOOL_BADGES.find((tool) => tool.id === id))
    .filter((tool): tool is (typeof TOOL_BADGES)[number] => Boolean(tool));
}

function fallbackTools(text: string, skills: SkillBadge[]) {
  const ranked = rankByKeywords(TOOL_BADGES, text, TOOL_KEYWORDS, 3);
  return ranked.length > 0 ? ranked : deriveToolLoadout(skills);
}

function parseIdentity(identityMarkdown: string, soulMarkdown: string, fallbackNameHint: string): { name: string; identity: ClawIdentity; archetype: string; intro: string } {
  const frontmatter = parseFrontmatter(identityMarkdown);
  const stripped = stripMarkdown(identityMarkdown);
  const name =
    sanitizeIdentityValue(frontmatter.name) ||
    sanitizeIdentityValue(findField(identityMarkdown, ['name'])) ||
    sanitizeIdentityValue(firstHeading(identityMarkdown)) ||
    sanitizeIdentityValue(fallbackNameHint) ||
    basename(frontmatter.slug || 'Specimen').replace(/\.md$/i, '') ||
    'Specimen';
  const role =
    sanitizeIdentityValue(frontmatter.role) ||
    sanitizeIdentityValue(frontmatter.title) ||
    sanitizeIdentityValue(findField(identityMarkdown, ['role', 'title'])) ||
    'Field Specimen';
  const directive =
    sanitizeIdentityValue(frontmatter.directive) ||
    sanitizeIdentityValue(findField(identityMarkdown, ['directive', 'mission', 'purpose'])) ||
    sanitizeIdentityValue(firstParagraph(identityMarkdown)) ||
    'Hold the line and keep the hatchery stable.';
  const vibe =
    sanitizeIdentityValue(frontmatter.vibe) ||
    sanitizeIdentityValue(frontmatter.tone) ||
    sanitizeIdentityValue(findField(identityMarkdown, ['vibe', 'tone', 'style'])) ||
    'Measured · Adaptive';
  const creature =
    sanitizeIdentityValue(frontmatter.creature) ||
    sanitizeIdentityValue(frontmatter.species) ||
    sanitizeIdentityValue(findField(identityMarkdown, ['creature', 'species', 'chassis'])) ||
    'OpenClaw Hatchling';
  const emoji =
    sanitizeIdentityValue(frontmatter.emoji) ||
    sanitizeIdentityValue(findField(identityMarkdown, ['emoji'])) ||
    extractEmoji(identityMarkdown) ||
    extractEmoji(soulMarkdown) ||
    '🧬';

  return {
    name,
    identity: {
      creature,
      role,
      directive,
      vibe,
      emoji,
    },
    archetype: role,
    intro: stripped.slice(0, 180) || directive,
  };
}

async function listZipEntries(zipPath: string) {
  const { stdout } = await execFile('unzip', ['-Z1', zipPath]);
  const rawEntries = stdout
    .split('\n')
    .map((entry) => normalizePath(entry.trim()))
    .filter(Boolean)
    .filter((entry) => !entry.endsWith('/'));

  const topLevel = new Set(rawEntries.map((entry) => entry.split('/')[0]).filter(Boolean));
  const hasRootFiles = rawEntries.some((entry) => !entry.includes('/'));
  const shouldStripRoot = topLevel.size === 1 && !hasRootFiles;

  return rawEntries.map((rawPath) => ({
    rawPath,
    path: shouldStripRoot ? rawPath.split('/').slice(1).join('/') : rawPath,
  }));
}

async function readZipText(zipPath: string, rawPath: string) {
  const { stdout } = await execFile('unzip', ['-p', zipPath, rawPath], { encoding: 'utf8', maxBuffer: 1024 * 1024 });
  return stdout;
}

async function readZipBuffer(zipPath: string, rawPath: string) {
  const { stdout } = await execFile('unzip', ['-p', zipPath, rawPath], { encoding: 'buffer', maxBuffer: 4 * 1024 * 1024 });
  return stdout as Buffer;
}

async function buildZipBuffer(entries: Array<{ path: string; contents: Buffer }>) {
  const tempDir = await mkdtemp(join(tmpdir(), 'clawpark-skill-'));
  const outPath = join(tempDir, 'sanitized-skill.zip');

  try {
    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(tempDir, entry.path);
        await writeFile(fullPath, entry.contents, { flag: 'wx' }).catch(async (error: NodeJS.ErrnoException) => {
          if (error.code === 'ENOENT') {
            const parent = fullPath.split('/').slice(0, -1).join('/');
            if (parent) {
              await mkdir(parent, { recursive: true });
              await writeFile(fullPath, entry.contents);
              return;
            }
          }
          throw error;
        });
      }),
    );

    await execFile('python3', ['-c', `
import pathlib, sys, zipfile
base = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2])
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
    for path in base.rglob('*'):
        if path.is_file() and path != out:
            zf.write(path, arcname=path.relative_to(base))
`, tempDir, outPath]);
    return await readFile(outPath);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function safePathSegment(value: string) {
  return slugify(value) || shortHash(value);
}

function renderIdentityMarkdown(claw: Claw) {
  const identity = getClawIdentity(claw);
  const lineage = claw.lineage
    ? [
        '## Lineage',
        `- Parent A: ${claw.lineage.parentA}`,
        `- Parent B: ${claw.lineage.parentB}`,
      ].join('\n')
    : '## Lineage\n- First-generation park specimen';

  return [
    '---',
    `name: ${claw.name}`,
    `creature: ${identity.creature}`,
    `role: ${identity.role}`,
    `directive: ${identity.directive}`,
    `vibe: ${identity.vibe}`,
    `emoji: ${identity.emoji}`,
    `generation: ${claw.generation}`,
    `id: ${claw.id}`,
    '---',
    '',
    `# ${claw.name}`,
    '',
    `Creature: ${identity.creature}`,
    `Role: ${identity.role}`,
    `Directive: ${identity.directive}`,
    `Vibe: ${identity.vibe}`,
    `Emoji: ${identity.emoji}`,
    '',
    '## Intro',
    claw.intro,
    '',
    lineage,
    '',
  ].join('\n');
}

function renderSoulMarkdown(claw: Claw) {
  const inheritanceLines = claw.lineage?.inheritanceMap?.length
    ? claw.lineage.inheritanceMap.map((record) =>
      `- ${record.label} (${record.type}) ← ${record.origin}${record.kind ? ` [${record.kind}]` : ''}${record.detail ? ` — ${record.detail}` : ''}`)
    : ['- No recorded inheritance changes yet.'];

  return [
    `# ${claw.name} Soul`,
    '',
    '## Summary',
    summarizeSoul(claw),
    '',
    '## Traits',
    ...claw.soul.traits.map((trait) => `- ${trait.label} — ${trait.description}`),
    '',
    '## Inheritance',
    ...inheritanceLines,
    '',
  ].join('\n');
}

function renderToolsMarkdown(claw: Claw) {
  const tools = getClawTools(claw).loadout;
  return [
    `# ${claw.name} Tools`,
    '',
    '## Summary',
    summarizeTools(claw),
    '',
    '## Loadout',
    ...tools.map((tool) => `- ${tool.label} ${tool.icon} — ${tool.description}`),
    '',
  ].join('\n');
}

function renderSkillMarkdown(claw: Claw, skill: SkillBadge) {
  return [
    '---',
    `name: ${skill.label}`,
    `description: Exported ClawPark skill badge for ${claw.name}.`,
    '---',
    '',
    `# ${skill.label}`,
    '',
    `Badge: ${skill.label} ${skill.icon}`,
    `Dominance: ${skill.dominance}`,
    '',
    summarizeSkills({
      ...claw,
      skills: { badges: [skill] },
    }),
    '',
  ].join('\n');
}

export async function buildOpenClawWorkspaceZip(claw: Claw): Promise<Buffer> {
  const entries: Array<{ path: string; contents: Buffer }> = [
    {
      path: 'IDENTITY.md',
      contents: Buffer.from(renderIdentityMarkdown(claw), 'utf8'),
    },
    {
      path: 'SOUL.md',
      contents: Buffer.from(renderSoulMarkdown(claw), 'utf8'),
    },
    {
      path: 'TOOLS.md',
      contents: Buffer.from(renderToolsMarkdown(claw), 'utf8'),
    },
  ];

  for (const skill of claw.skills.badges) {
    entries.push({
      path: `skills/${safePathSegment(skill.label)}/SKILL.md`,
      contents: Buffer.from(renderSkillMarkdown(claw, skill), 'utf8'),
    });
  }

  return buildZipBuffer(entries);
}

export interface ParsedOpenClawBundle {
  claw: Claw;
  manifest: ClawBundleManifest;
}

export interface ParsedOpenClawSkillBundle {
  skill: PublishedSkill;
  manifest: SkillBundleManifest;
  bundleBytes: Buffer;
}

export async function parseOpenClawWorkspaceZip(zipPath: string): Promise<ParsedOpenClawBundle> {
  const allEntries = await listZipEntries(zipPath);
  // Skip denied files with a warning instead of rejecting the entire ZIP
  const denied = allEntries.filter((entry) => isDeniedPath(entry.path));
  const entries = allEntries.filter((entry) => !isDeniedPath(entry.path));

  const invalid = entries.filter((entry) => !CLAW_ALLOWLIST.includes(entry.path) && !/^skills\/[^/]+\/SKILL\.md$/i.test(entry.path));
  const includedFiles = entries.filter((entry) => CLAW_ALLOWLIST.includes(entry.path) || /^skills\/[^/]+\/SKILL\.md$/i.test(entry.path));

  if (!includedFiles.some((entry) => entry.path === 'IDENTITY.md') || !includedFiles.some((entry) => entry.path === 'SOUL.md')) {
    throw new Error('Workspace ZIP must include IDENTITY.md and SOUL.md.');
  }

  const identityEntry = includedFiles.find((entry) => entry.path === 'IDENTITY.md');
  const soulEntry = includedFiles.find((entry) => entry.path === 'SOUL.md');
  if (!identityEntry || !soulEntry) {
    throw new Error('Workspace ZIP must include IDENTITY.md and SOUL.md.');
  }

  const identityMarkdown = await readZipText(zipPath, identityEntry.rawPath);
  const soulMarkdown = await readZipText(zipPath, soulEntry.rawPath);
  const toolsEntry = includedFiles.find((entry) => entry.path === 'TOOLS.md');
  const toolsMarkdown = toolsEntry ? await readZipText(zipPath, toolsEntry.rawPath) : '';
  const skillTexts = await Promise.all(
    includedFiles
      .filter((entry) => /^skills\/[^/]+\/SKILL\.md$/i.test(entry.path))
      .map(async (entry) => ({ path: entry.path, text: await readZipText(zipPath, entry.rawPath) })),
  );

  const warnings: string[] = [];
  if (denied.length > 0) warnings.push(`Skipped ${denied.length} restricted file(s): ${denied.slice(0, 3).map((e) => e.path).join(', ')}${denied.length > 3 ? '...' : ''}`);
  if (!toolsMarkdown) warnings.push('TOOLS.md missing; tool loadout inferred from skills.');
  if (skillTexts.length === 0) warnings.push('No skills/*/SKILL.md files found; skill badges inferred from SOUL and IDENTITY.');
  if (invalid.length > 0) warnings.push(`Ignored ${invalid.length} non-public files from the upload.`);

  const fallbackNameHint = basename(zipPath).replace(/\.zip$/i, '');
  const identity = parseIdentity(identityMarkdown, soulMarkdown, fallbackNameHint);
  const soulTraits = fallbackSoulTraits(`${identityMarkdown}\n${soulMarkdown}`);
  const skills = fallbackSkillBadges(
    `${identityMarkdown}\n${soulMarkdown}\n${skillTexts.map((entry) => `${entry.path}\n${entry.text}`).join('\n')}`,
    soulTraits,
  );
  const tools = fallbackTools(`${toolsMarkdown}\n${skillTexts.map((entry) => entry.text).join('\n')}`, skills);
  const visual = buildVisual(identity.name, soulTraits, skills);
  const id = `market-${slugify(identity.name) || 'claw'}-${shortHash(`${identity.name}:${identity.identity.directive}:${identity.intro}`)}`;
  const intro = identity.intro.length > 180 ? `${identity.intro.slice(0, 177)}...` : identity.intro;

  const claw: Claw = {
    id,
    name: identity.name,
    archetype: identity.archetype,
    generation: 0,
    identity: identity.identity,
    soul: { traits: soulTraits },
    skills: { badges: skills },
    tools: { loadout: tools },
    visual,
    intro,
    lineage: null,
  };

  const manifest: ClawBundleManifest = {
    kind: 'claw',
    bundleVersion: 1,
    source: 'openclaw-workspace-zip',
    includedFiles: includedFiles.map((entry) => entry.path),
    ignoredFiles: invalid.map((entry) => entry.path),
    warnings,
    generatedAt: new Date().toISOString(),
    toolsVisibility: 'full',
    coverStyle: 'avatar',
  };

  return { claw, manifest };
}

export async function parseOpenClawSkillZip(zipPath: string): Promise<ParsedOpenClawSkillBundle> {
  const entries = await listZipEntries(zipPath);
  const denied = entries.filter((entry) => isDeniedPath(entry.path));
  if (denied.length > 0) {
    throw new Error(`Upload contains restricted files: ${denied.slice(0, 3).map((entry) => entry.path).join(', ')}`);
  }

  const includedFiles = entries.filter((entry) => SKILL_ALLOWLIST.some((pattern) => pattern.test(entry.path)));
  const invalid = entries.filter((entry) => !SKILL_ALLOWLIST.some((pattern) => pattern.test(entry.path)));

  const skillEntry = includedFiles.find((entry) => /^SKILL\.md$/i.test(entry.path));
  if (!skillEntry) {
    throw new Error('Skill ZIP must include SKILL.md at the bundle root.');
  }

  const skillMarkdown = await readZipText(zipPath, skillEntry.rawPath);
  const frontmatter = parseFrontmatter(skillMarkdown);
  const name = frontmatter.name || findField(skillMarkdown, ['name']) || firstHeading(skillMarkdown) || 'Unnamed Skill';
  const description =
    frontmatter.description ||
    findField(skillMarkdown, ['description', 'summary']) ||
    firstParagraph(skillMarkdown) ||
    'Reusable OpenClaw skill bundle.';
  const summary = description.length > 220 ? `${description.slice(0, 217)}...` : description;
  const scriptFiles = includedFiles.filter((entry) => /^scripts\//i.test(entry.path)).map((entry) => entry.path);
  const assetFiles = includedFiles.filter((entry) => /^assets\//i.test(entry.path)).map((entry) => entry.path);
  const referenceFiles = includedFiles.filter((entry) => /^references\//i.test(entry.path) || /^README\.md$/i.test(entry.path)).map((entry) => entry.path);
  const warnings: string[] = [];
  if (invalid.length > 0) warnings.push(`Ignored ${invalid.length} non-public files from the upload.`);
  if (scriptFiles.length === 0) warnings.push('No scripts/ files found; this skill publishes as instructions-only metadata.');

  const skill: PublishedSkill = {
    slug: slugify(frontmatter.slug || name) || `skill-${shortHash(name)}`,
    name,
    description,
    summary,
    entrypoint: 'SKILL.md',
    scriptFiles,
    assetFiles,
    referenceFiles,
  };

  const manifest: SkillBundleManifest = {
    kind: 'skill',
    bundleVersion: 1,
    source: 'openclaw-skill-zip',
    includedFiles: includedFiles.map((entry) => entry.path),
    ignoredFiles: invalid.map((entry) => entry.path),
    warnings,
    generatedAt: new Date().toISOString(),
    entrypoint: 'SKILL.md',
    scriptFiles,
    assetFiles,
    referenceFiles,
  };

  const bundleEntries = await Promise.all(
    includedFiles.map(async (entry) => ({
      path: entry.path,
      contents: await readZipBuffer(zipPath, entry.rawPath),
    })),
  );
  const bundleBytes = await buildZipBuffer(bundleEntries);

  return { skill, manifest, bundleBytes };
}
