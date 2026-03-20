import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import App from '../src/App';
import { createInitialStoreState, useClawStore } from '../src/store/useClawStore';

function renderApp() {
  render(createElement(App));
}

async function openNursery() {
  fireEvent.click(await screen.findByRole('button', { name: /^Nursery$/i }));
  await screen.findByRole('button', { name: /^Select Sage$/i });
}

function clickClawCard(name: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Select ${name}$`, 'i') }));
}

describe('ClawPark catalogue-first UI contracts', () => {
  beforeEach(() => {
    useClawStore.setState(createInitialStoreState());
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
    useClawStore.setState(createInitialStoreState());
    window.history.replaceState({}, '', '/');
  });

  it('opens on the home shell and only unlocks breeding after two picks in the nursery', async () => {
    renderApp();

    expect(await screen.findByText(/ClawPark/i)).toBeInTheDocument();
    expect(screen.getByText(/control room/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${useClawStore.getState().claws.length}\\s+specimen`, 'i'))).toBeInTheDocument();

    await openNursery();

    const enterBreedLab = await screen.findByRole('button', { name: /^Enter Lab$/i });
    expect(enterBreedLab).toBeDisabled();

    clickClawCard('Sage');
    clickClawCard('Bolt');

    await waitFor(() => {
      expect(enterBreedLab).toBeEnabled();
      expect(useClawStore.getState().selectedIds).toEqual(['claw-001', 'claw-002']);
    });
  });

  it('navigates from the home shell into the nursery and exposes the selection controls', async () => {
    renderApp();

    await screen.findByText(/ClawPark/i);
    await openNursery();

    expect(await screen.findByRole('button', { name: /^Select Sage$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Select Bolt$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Enter Lab$/i })).toBeInTheDocument();
  });

  it('shows the Marketplace entry point in the mounted app shell', async () => {
    renderApp();

    expect(await screen.findByRole('button', { name: /Marketplace/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Marketplace$/i }));

    expect(await screen.findByText(/Marketplace/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /My Claws/i })).toBeInTheDocument();
  });

  it('keeps the breed lab prediction and trait-bias controls in the main browse flow', async () => {
    renderApp();

    await screen.findByText(/ClawPark/i);
    await openNursery();
    clickClawCard('Sage');
    clickClawCard('Bolt');
    fireEvent.click(screen.getByRole('button', { name: /^Enter Lab$/i }));

    expect(await screen.findByText(/Trait bias/i)).toBeInTheDocument();
    expect(screen.getByText(/Expected inheritance/i)).toBeInTheDocument();
    expect(screen.getByText(/Mutation/i)).toBeInTheDocument();
    expect(screen.getByText(/Archetype/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Caution/i }));

    await waitFor(() => {
      expect(useClawStore.getState().preferredTraitId).toBe('trait-caution');
    });
  });

  it('preserves the birth-to-lineage-to-nursery loop after breeding', async () => {
    const initialCount = useClawStore.getState().claws.length;

    renderApp();

    await screen.findByText(/ClawPark/i);
    await openNursery();
    clickClawCard('Sage');
    clickClawCard('Bolt');
    fireEvent.click(screen.getByRole('button', { name: /^Enter Lab$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Initiate Breeding/i }));

    await waitFor(() => {
      expect(useClawStore.getState().screen).toBe('birth');
      expect(useClawStore.getState().breedResult).not.toBeNull();
    });

    act(() => {
      useClawStore.getState().setBirthPhase('complete');
    });

    act(() => {
      useClawStore.getState().setScreen('lineage');
    });

    expect(await screen.findByRole('heading', { name: /Lineage/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save to nursery/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Save to nursery/i }));

    await waitFor(() => {
      expect(useClawStore.getState().screen).toBe('nursery');
      expect(useClawStore.getState().claws).toHaveLength(initialCount + 1);
      expect(useClawStore.getState().selectedIds).toEqual([]);
    });
  });
});
