// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { parseOpenClawSkillZip, parseOpenClawWorkspaceZip } from '../../server/openclawParser.ts';
import {
  MARKETPLACE_SEED_FIXTURES,
  MARKETPLACE_SEED_FIXTURE_ROOT,
  MARKETPLACE_SEED_LISTINGS,
} from '../../src/services/marketplaceSeed.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_ROOT = resolve(__dirname, '../../integrations/openclaw-marketplace-examples');
const tempDirs: string[] = [];

function zipFixtureDirectory(sourceDir: string) {
  const tempDir = mkdtempSync(join(tmpdir(), 'clawpark-example-'));
  tempDirs.push(tempDir);
  const zipPath = join(tempDir, 'bundle.zip');
  execFileSync(
    'python3',
    [
      '-c',
      [
        'import pathlib, sys, zipfile',
        'source = pathlib.Path(sys.argv[1])',
        'destination = pathlib.Path(sys.argv[2])',
        "with zipfile.ZipFile(destination, 'w') as zf:",
        '    for path in sorted(source.rglob("*")):',
        '        if path.is_file():',
        '            zf.write(path, path.relative_to(source))',
      ].join('\n'),
      sourceDir,
      zipPath,
    ],
    { stdio: 'pipe' },
  );
  return zipPath;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('local OpenClaw marketplace example bundles', () => {
  it('ships exactly three local example bundle directories', () => {
    expect(existsSync(FIXTURES_ROOT)).toBe(true);
    expect(MARKETPLACE_SEED_FIXTURE_ROOT).toBe('integrations/openclaw-marketplace-examples');
    const bundleDirs = readdirSync(FIXTURES_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(bundleDirs).toEqual(['containment-launch-skill', 'meridian-claw', 'park-audit-skill']);
    expect(MARKETPLACE_SEED_FIXTURES).toEqual({
      meridianClaw: 'integrations/openclaw-marketplace-examples/meridian-claw',
      parkAuditSkill: 'integrations/openclaw-marketplace-examples/park-audit-skill',
      containmentLaunchSkill: 'integrations/openclaw-marketplace-examples/containment-launch-skill',
    });
  });

  it('parses the Meridian claw example and matches the seed catalogue', async () => {
    const zipPath = zipFixtureDirectory(join(FIXTURES_ROOT, 'meridian-claw'));
    const result = await parseOpenClawWorkspaceZip(zipPath);

    expect(result.claw.name).toBe('Meridian');
    expect(result.manifest.kind).toBe('claw');
    expect(result.manifest.includedFiles).toContain('IDENTITY.md');
    expect(result.manifest.includedFiles).toContain('SOUL.md');
    expect(result.manifest.includedFiles.some((entry) => entry.endsWith('skills/field-notes/SKILL.md'))).toBe(true);

    const seedClaw = MARKETPLACE_SEED_LISTINGS.find((listing) => listing.kind === 'claw');
    expect(seedClaw?.title).toBe(result.claw.name);
    expect(seedClaw?.publisherMode).toBe('discord-session');
    expect(seedClaw?.manifest.includedFiles).toEqual(['IDENTITY.md', 'SOUL.md', 'TOOLS.md', 'skills/field-notes/SKILL.md']);
    expect(seedClaw?.manifest.warnings).toContain(
      `Local example fixture: ${MARKETPLACE_SEED_FIXTURES.meridianClaw}`,
    );
  });

  it('parses the local skill examples and matches the seed catalogue', async () => {
    const parkAudit = await parseOpenClawSkillZip(zipFixtureDirectory(join(FIXTURES_ROOT, 'park-audit-skill')));
    const containmentLaunch = await parseOpenClawSkillZip(
      zipFixtureDirectory(join(FIXTURES_ROOT, 'containment-launch-skill')),
    );

    expect(parkAudit.skill.name).toBe('Park Audit');
    expect(parkAudit.manifest.kind).toBe('skill');
    expect(parkAudit.manifest.scriptFiles).toContain('scripts/park_audit.py');
    expect(parkAudit.manifest.referenceFiles).toContain('references/checklist.md');

    expect(containmentLaunch.skill.name).toBe('Containment Launch');
    expect(containmentLaunch.manifest.kind).toBe('skill');
    expect(containmentLaunch.manifest.scriptFiles).toContain('scripts/release_gate.sh');
    expect(containmentLaunch.manifest.assetFiles).toContain('assets/release-card.txt');

    expect(MARKETPLACE_SEED_LISTINGS.map((listing) => listing.title)).toEqual([
      'Meridian',
      'Park Audit',
      'Containment Launch',
    ]);

    const seedSkills = MARKETPLACE_SEED_LISTINGS.filter((listing) => listing.kind === 'skill');
    expect(seedSkills.map((listing) => listing.title)).toEqual([parkAudit.skill.name, containmentLaunch.skill.name]);
    expect(seedSkills.map((listing) => listing.publisherMode)).toEqual(['local-skill', 'local-skill']);
    expect(seedSkills[0]?.manifest.warnings).toContain(
      `Local example fixture: ${MARKETPLACE_SEED_FIXTURES.parkAuditSkill}`,
    );
    expect(seedSkills[1]?.manifest.warnings).toContain(
      `Local example fixture: ${MARKETPLACE_SEED_FIXTURES.containmentLaunchSkill}`,
    );
  });
});
