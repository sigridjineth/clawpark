import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../src/App';
import { INITIAL_CLAWS } from '../src/data/claws';
import { createInitialStoreState, useClawStore } from '../src/store/useClawStore';

const clawListing = {
  id: 'listing-claw-1',
  slug: 'sage-demo',
  kind: 'claw' as const,
  trust: 'unsigned' as const,
  publisherMode: 'local-skill' as const,
  title: 'Sage',
  summary: 'A calm park analyst ready for public listing.',
  claw: INITIAL_CLAWS[0],
  publisher: {
    id: 'publisher-1',
    kind: 'unsigned' as const,
    displayName: 'Local Moltbot Publisher',
    avatarUrl: null,
    profileUrl: null,
  },
  manifest: {
    kind: 'claw' as const,
    bundleVersion: 1,
    source: 'openclaw-workspace-zip' as const,
    includedFiles: ['IDENTITY.md', 'SOUL.md'],
    ignoredFiles: [],
    warnings: [],
    generatedAt: '2026-03-10T00:00:00.000Z',
    toolsVisibility: 'full' as const,
    coverStyle: 'avatar' as const,
  },
  createdAt: '2026-03-10T00:00:00.000Z',
  updatedAt: '2026-03-10T00:00:00.000Z',
  publishedAt: '2026-03-10T00:00:00.000Z',
  currentVersion: { version: 1, publishedAt: '2026-03-10T00:00:00.000Z' },
  bundleDownloadUrl: '/api/marketplace/listings/sage-demo/bundle',
  claimable: true as const,
};

const skillListing = {
  id: 'listing-skill-1',
  slug: 'park-audit-skill',
  kind: 'skill' as const,
  trust: 'unsigned' as const,
  publisherMode: 'local-skill' as const,
  title: 'Park Audit',
  summary: 'Scans an enclosure for broken assumptions.',
  skill: {
    slug: 'park-audit',
    name: 'Park Audit',
    description: 'Scans an enclosure for broken assumptions.',
    summary: 'Scans an enclosure for broken assumptions.',
    entrypoint: 'SKILL.md',
    scriptFiles: ['scripts/park_audit.py'],
    assetFiles: [],
    referenceFiles: ['README.md'],
  },
  publisher: {
    id: 'publisher-2',
    kind: 'unsigned' as const,
    displayName: 'Local Moltbot Publisher',
    avatarUrl: null,
    profileUrl: null,
  },
  manifest: {
    kind: 'skill' as const,
    bundleVersion: 1,
    source: 'openclaw-skill-zip' as const,
    includedFiles: ['SKILL.md', 'scripts/park_audit.py'],
    ignoredFiles: [],
    warnings: [],
    generatedAt: '2026-03-10T00:00:00.000Z',
    entrypoint: 'SKILL.md',
    scriptFiles: ['scripts/park_audit.py'],
    assetFiles: [],
    referenceFiles: ['README.md'],
  },
  createdAt: '2026-03-10T00:00:00.000Z',
  updatedAt: '2026-03-10T00:00:00.000Z',
  publishedAt: '2026-03-10T00:00:00.000Z',
  currentVersion: { version: 1, publishedAt: '2026-03-10T00:00:00.000Z' },
  bundleDownloadUrl: '/api/marketplace/listings/park-audit-skill/bundle',
  claimable: false as const,
  installHint: 'Install into ~/.agents/skills/park-audit',
};

describe('marketplace publish flow contracts', () => {
  beforeEach(() => {
    useClawStore.setState(createInitialStoreState());
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/api/auth/session')) {
          return new Response(JSON.stringify({ user: null, authConfigured: true }), { status: 200 });
        }
        if (url.endsWith('/api/marketplace/listings')) {
          return new Response(JSON.stringify([clawListing, skillListing]), { status: 200 });
        }
        if (url.includes('/api/marketplace/listings/sage-demo/bundle')) {
          return new Response(JSON.stringify({ kind: 'claw', claw: clawListing.claw, manifest: clawListing.manifest }), { status: 200 });
        }
        return new Response('Not found', { status: 404 });
      }),
    );
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    useClawStore.setState(createInitialStoreState());
    window.history.replaceState({}, '', '/');
  });

  it('shows claw and skill tabs, unsigned badges, and the Discord login gate for verified publish', async () => {
    render(createElement(App));

    fireEvent.click(await screen.findByRole('button', { name: /Marketplace/i }));

    expect(await screen.findByText(/Sage/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Unverified/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Browse Skills/i }));

    await waitFor(() => {
      expect(screen.getByText(/Park Audit/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Copy install steps/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Publish$/i }));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Sign in with Discord/i })).toBeInTheDocument();
      expect(screen.getByText(/Moltbot-style publish/i)).toBeInTheDocument();
      expect(screen.getByText(/CLAWPARK_MARKETPLACE_URL/i)).toBeInTheDocument();
    });
  });
});
