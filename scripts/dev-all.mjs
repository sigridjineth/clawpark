/* global process, console, setTimeout */
import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';

function start(label, script) {
  const child = spawn(npmCommand, ['run', script], {
    stdio: 'inherit',
    env: process.env,
    detached: !isWindows,
  });

  child.on('error', (error) => {
    console.error(`[${label}] failed to start`, error);
  });

  return child;
}

const children = [
  start('web', 'dev:web'),
  start('server', 'server:dev'),
];

let shuttingDown = false;

function stopChild(child) {
  if (!child || child.killed) return;

  if (isWindows) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }

  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    // already stopped
  }
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    stopChild(child);
  }
  setTimeout(() => process.exit(code), 100);
}

for (const child of children) {
  child.on('exit', (code) => {
    if (shuttingDown) return;
    shutdown(code ?? 0);
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
