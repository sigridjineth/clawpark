import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Import } from '../src/components/Import/Import';
import type { ImportPreview } from '../src/types/specimen';

const preview = (id: string, name: string): ImportPreview => ({
  specimen: {
    id,
    name,
    claw: {
      id,
      name,
      archetype: 'Field Specimen',
      generation: 0,
      identity: {
        creature: 'OpenClaw Hatchling',
        role: 'Field Specimen',
        directive: 'Hold the line.',
        vibe: 'Measured · Adaptive',
        emoji: '🧬',
      },
      soul: { traits: [] },
      skills: { badges: [] },
      tools: { loadout: [] },
      visual: {
        primaryColor: '#fff',
        secondaryColor: '#000',
        shapeModifiers: ['geometric'],
        pattern: 'solid',
        glowIntensity: 0.5,
      },
      intro: 'Specimen intro',
      lineage: null,
    },
    ownershipState: 'imported',
    breedState: 'ready',
    discordUserId: null,
    importRecordId: null,
    parentAId: null,
    parentBId: null,
    createdAt: '2026-03-20T00:00:00Z',
    updatedAt: '2026-03-20T00:00:00Z',
  },
  importRecord: {
    importId: `imp-${id}`,
    sourceKind: 'openclaw_zip',
    uploadedAt: '2026-03-20T00:00:00Z',
    includedFiles: ['IDENTITY.md', 'SOUL.md'],
    ignoredFiles: [],
    warnings: [],
    fingerprint: `fp-${id}`,
    specimenId: id,
    discordUserId: null,
  },
});

describe('Import component', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('passes two zip files to the import handler in one action and renders multiple previews', async () => {
    const onImport = vi.fn().mockResolvedValue(undefined);
    const onClaim = vi.fn().mockResolvedValue(undefined);
    const onClearPreview = vi.fn();
    const onDismissPreview = vi.fn();

    render(
      <Import
        onImport={onImport}
        onClaim={onClaim}
        importPreviews={[preview('spec-a', 'khl7q5'), preview('spec-b', 'dgxspark-claw')]}
        onClearPreview={onClearPreview}
        onDismissPreview={onDismissPreview}
      />,
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const zipA = new File(['a'], 'khl7q5.zip', { type: 'application/zip' });
    const zipB = new File(['b'], 'dgxspark-claw.zip', { type: 'application/zip' });

    fireEvent.change(input, { target: { files: [zipA, zipB] } });

    await waitFor(() => {
      expect(onImport).toHaveBeenCalledWith([zipA, zipB], undefined);
    });

    expect(screen.getByText(/Import previews \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText('khl7q5')).toBeInTheDocument();
    expect(screen.getByText('dgxspark-claw')).toBeInTheDocument();
  });
});
