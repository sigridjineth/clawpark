import { execFile as execFileCallback } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { parseOpenClawSkillZip } from './openclawParser.ts';

const execFile = promisify(execFileCallback);

function expandHomePath(path: string) {
  if (path === '~') return homedir();
  if (path.startsWith('~/')) return join(homedir(), path.slice(2));
  return path;
}

export function resolveSkillInstallRoot(path: string, cwd = process.cwd()) {
  const expanded = expandHomePath(path);
  return isAbsolute(expanded) ? expanded : resolve(cwd, expanded);
}

function displayPath(path: string) {
  const home = homedir();
  const cwdSkills = resolve(process.cwd(), 'skills');
  if (path === cwdSkills || path.startsWith(`${cwdSkills}/`)) {
    return path.replace(cwdSkills, './skills');
  }
  return path === home || path.startsWith(`${home}/`) ? path.replace(home, '~') : path;
}

export function formatSkillInstallHint(path: string, skillSlug: string) {
  return `Install into ${displayPath(join(resolveSkillInstallRoot(path), skillSlug))}`;
}

export class SkillInstallConflictError extends Error {
  code = 'skill_install_exists';
  overwriteRequired = true;

  constructor(readonly installedPath: string) {
    super(`Skill already exists at ${installedPath}. Re-run with overwrite enabled to replace it.`);
    this.name = 'SkillInstallConflictError';
  }
}

export async function installMarketplaceSkillBundle(params: {
  zipPath: string;
  skillSlug: string;
  installRoot: string;
  overwrite?: boolean;
}) {
  const installRoot = resolveSkillInstallRoot(params.installRoot);
  const installedPath = join(installRoot, params.skillSlug);
  const overwrite = Boolean(params.overwrite);
  const hadExistingInstall = existsSync(installedPath);

  if (hadExistingInstall && !overwrite) {
    throw new SkillInstallConflictError(installedPath);
  }

  const parsed = await parseOpenClawSkillZip(params.zipPath);
  if (parsed.skill.slug !== params.skillSlug) {
    throw new Error(`Skill bundle slug mismatch. Expected ${params.skillSlug}, received ${parsed.skill.slug}.`);
  }

  await mkdir(installRoot, { recursive: true });
  const stagingRoot = await mkdtemp(join(installRoot, '.clawpark-install-'));
  const archivePath = join(stagingRoot, 'skill.zip');
  const extractedPath = join(stagingRoot, 'bundle');

  try {
    await writeFile(archivePath, parsed.bundleBytes, { flag: 'wx' });
    await execFile('unzip', ['-q', archivePath, '-d', extractedPath]);

    if (hadExistingInstall) {
      await rm(installedPath, { recursive: true, force: true });
    }

    await rename(extractedPath, installedPath);
    return { installedPath, overwritten: hadExistingInstall && overwrite };
  } finally {
    await rm(stagingRoot, { recursive: true, force: true }).catch(() => undefined);
  }
}
