import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { createMarketplaceServer } from '../../server/index.ts';
import { buildSessionCookie } from '../../server/sessions.ts';

export function createWorkspaceZip(files: Record<string, string>, filename = 'workspace.zip') {
  const dir = mkdtempSync(join(tmpdir(), 'clawpark-scenario-'));
  const zipPath = join(dir, filename);
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

export async function buildZipForm(field: string, zipPath: string, name = 'workspace.zip') {
  const form = new FormData();
  const buffer = execFileSync('python3', ['-c', 'import pathlib,sys; sys.stdout.buffer.write(pathlib.Path(sys.argv[1]).read_bytes())', zipPath]);
  form.append(field, new File([buffer], name, { type: 'application/zip' }));
  return form;
}

export interface ScenarioServerHandle {
  tempRoot: string;
  baseUrl: string;
  server: Server;
  close: () => Promise<void>;
  cleanup: () => void;
  authCookie: string;
}

export async function startScenarioServer(): Promise<ScenarioServerHandle> {
  const tempRoot = mkdtempSync(join(tmpdir(), 'clawpark-scenario-server-'));
  const serverHandle = createMarketplaceServer({
    publicOrigin: 'http://127.0.0.1:8787',
    clientOrigin: 'http://127.0.0.1:5173',
    sqlitePath: join(tempRoot, 'marketplace.sqlite'),
    storageDir: join(tempRoot, 'storage'),
    skillInstallRoot: join(tempRoot, 'skills'),
    sessionSecret: 'test-secret',
    serveDist: false,
  });

  await new Promise<void>((resolve) => serverHandle.server.listen(0, '127.0.0.1', resolve));
  const address = serverHandle.server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unexpected server address');
  }

  const user = serverHandle.store.upsertDiscordUser({
    id: 'discord-user-1',
    username: 'sigrid',
    global_name: 'Sigrid',
    avatar: null,
  });
  if (!user) throw new Error('Failed to create test user');

  return {
    tempRoot,
    baseUrl: `http://127.0.0.1:${address.port}`,
    server: serverHandle.server,
    close: () => new Promise<void>((resolve) => serverHandle.server.close(() => resolve())),
    cleanup: () => rmSync(tempRoot, { recursive: true, force: true }),
    authCookie: buildSessionCookie(user, 'test-secret', false),
  };
}
