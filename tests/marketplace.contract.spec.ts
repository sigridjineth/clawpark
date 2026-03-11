import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../src/App';
import { INITIAL_CLAWS } from '../src/data/claws';
import { createInitialStoreState, useClawStore } from '../src/store/useClawStore';

const listing = {
  id: 'listing-1',
  slug: 'sage-demo',
  title: 'Sage',
  summary: 'A calm park analyst ready for public listing.',
  claw: INITIAL_CLAWS[0],
  publisher: {
    id: 'publisher-1',
    discordUserId: 'discord-1',
    username: 'sigrid',
    displayName: 'Sigrid',
    avatarUrl: null,
    discordHandle: '@sigrid',
    profileUrl: 'https://discord.com/users/discord-1',
  },
  manifest: {
    bundleVersion: 1,
    source: 'openclaw-workspace-zip',
    includedFiles: ['IDENTITY.md', 'SOUL.md'],
    ignoredFiles: [],
    warnings: [],
    generatedAt: '2026-03-10T00:00:00.000Z',
    toolsVisibility: 'full',
    coverStyle: 'avatar',
  },
  createdAt: '2026-03-10T00:00:00.000Z',
  updatedAt: '2026-03-10T00:00:00.000Z',
  publishedAt: '2026-03-10T00:00:00.000Z',
  currentVersion: { version: 1, publishedAt: '2026-03-10T00:00:00.000Z' },
  bundleDownloadUrl: '/api/marketplace/listings/sage-demo/bundle',
  claimable: true,
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
          return new Response(JSON.stringify([listing]), { status: 200 });
        }
        if (url.includes('/api/marketplace/listings/sage-demo/bundle')) {
          return new Response(JSON.stringify({ claw: listing.claw, manifest: listing.manifest }), { status: 200 });
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

  it('shows remote listings and the Discord login gate for publishing', async () => {
    render(createElement(App));

    fireEvent.click(await screen.findByRole('button', { name: /Marketplace/i }));

    expect(await screen.findByText(/Sage/i)).toBeInTheDocument();
    expect(screen.getByText(/@sigrid/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Publish$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Sign in with Discord/i)).toBeInTheDocument();
      expect(screen.getByText(/workspace ZIP/i)).toBeInTheDocument();
    });
  });
});
