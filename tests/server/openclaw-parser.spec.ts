// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseOpenClawSkillZip, parseOpenClawWorkspaceZip } from '../../server/openclawParser.ts';

function createWorkspaceZip(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'clawpark-parser-'));
  const zipPath = join(dir, 'workspace.zip');
  const payload = JSON.stringify(files);
  execFileSync('python3', ['-c', `
import json, pathlib, sys, zipfile
base = pathlib.Path(sys.argv[1])
zip_path = pathlib.Path(sys.argv[2])
files = json.loads(sys.argv[3])
for name, content in files.items():
    path = base / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding='utf-8')
with zipfile.ZipFile(zip_path, 'w') as zf:
    for name in files.keys():
        zf.write(base / name, arcname=name)
`, dir, zipPath, payload]);
  return { dir, zipPath };
}

afterEach(() => {
  // temp dirs are deleted per-test manually
});

describe('openclaw bundle parsers', () => {
  it('normalizes a valid OpenClaw claw bundle into a public draft', async () => {
    const { dir, zipPath } = createWorkspaceZip({
      'IDENTITY.md': '# Ember\nName: Ember\nCreature: Signal Raptor\nRole: The Park Tactician\nDirective: Coordinate the enclosure without dropping the thread.\nVibe: Calm · Exact\nEmoji: 🦖\n',
      'SOUL.md': '# Soul\nCore truths: analyze systems, document decisions, enforce boundaries.\n',
      'TOOLS.md': '# Tools\n- search the repo\n- monitor workflow state\n- keep the sandbox safe\n',
      'skills/review/SKILL.md': '---\nname: Review\n---\nReview plans, inspect code, and challenge weak assumptions.',
      'skills/strategy/SKILL.md': '---\nname: Strategy\n---\nDesign systems and orchestrate workflows.',
    });

    try {
      const result = await parseOpenClawWorkspaceZip(zipPath);
      expect(result.claw.name).toBe('Ember');
      expect(result.claw.identity?.role).toMatch(/Park Tactician/i);
      expect(result.claw.soul.traits.length).toBeGreaterThan(0);
      expect(result.claw.skills.badges.length).toBeGreaterThan(0);
      expect(result.claw.tools?.loadout.length).toBeGreaterThan(0);
      expect(result.manifest.kind).toBe('claw');
      expect(result.manifest.includedFiles).toContain('IDENTITY.md');
      expect(result.manifest.includedFiles.some((entry) => entry.endsWith('SKILL.md'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('parses a skill zip and emits an installable skill bundle', async () => {
    const { dir, zipPath } = createWorkspaceZip({
      'park-audit/SKILL.md': '---\nname: Park Audit\ndescription: Scan the enclosure for failures.\n---\nReview the current park state and challenge weak assumptions.',
      'park-audit/scripts/audit.py': 'print("audit")\n',
      'park-audit/references/checklist.md': '# checklist\n',
    });

    try {
      const result = await parseOpenClawSkillZip(zipPath);
      expect(result.skill.name).toBe('Park Audit');
      expect(result.skill.scriptFiles).toContain('scripts/audit.py');
      expect(result.manifest.kind).toBe('skill');
      expect(result.manifest.entrypoint).toBe('SKILL.md');
      expect(result.bundleBytes.byteLength).toBeGreaterThan(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('skips restricted files and records a warning instead of rejecting the whole import', async () => {
    const { dir, zipPath } = createWorkspaceZip({
      'IDENTITY.md': '# Phantom',
      'SOUL.md': '# Soul',
      'AGENTS.md': 'top secret',
    });

    try {
      const result = await parseOpenClawWorkspaceZip(zipPath);
      expect(result.claw.name).toBe('Phantom');
      expect(result.manifest.warnings.some((warning) => /restricted file/i.test(warning))).toBe(true);
      expect(result.manifest.includedFiles).toEqual(['IDENTITY.md', 'SOUL.md']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
