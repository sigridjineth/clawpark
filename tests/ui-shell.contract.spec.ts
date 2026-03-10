import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import App from '../src/App';
import { createInitialStoreState, useClawStore } from '../src/store/useClawStore';

function renderApp() {
  render(createElement(App));
}

function clickClawCard(name: string) {
  const buttons = screen.getAllByRole('button', { name: new RegExp(`^${name}$`, 'i') });
  fireEvent.click(buttons[0]);
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

  it('opens on the catalogue shell and only unlocks breeding after two picks', async () => {
    renderApp();

    expect(await screen.findByText(/ClawPark/i)).toBeInTheDocument();
    expect(screen.getByText(/specimens/i)).toBeInTheDocument();

    const enterBreedLab = screen.getByRole('button', { name: /Enter Breed Lab/i });
    expect(enterBreedLab).toBeDisabled();

    clickClawCard('Sage');
    clickClawCard('Bolt');

    await waitFor(() => {
      expect(enterBreedLab).toBeEnabled();
      expect(useClawStore.getState().selectedIds).toEqual(['claw-001', 'claw-002']);
    });
  });

  it('keeps the breed lab prediction and trait-bias controls in the main browse flow', async () => {
    renderApp();

    await screen.findByText(/ClawPark/i);
    clickClawCard('Sage');
    clickClawCard('Bolt');
    fireEvent.click(screen.getByRole('button', { name: /Enter Breed Lab/i }));

    expect(await screen.findByText(/Trait bias/i)).toBeInTheDocument();
    expect(screen.getByText(/Expected inheritance/i)).toBeInTheDocument();
    expect(screen.getByText(/Mutation/i)).toBeInTheDocument();
    expect(screen.getByText(/Archetype/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Caution/i }));

    await waitFor(() => {
      expect(useClawStore.getState().preferredTraitId).toBe('trait-caution');
    });
  });

  it('preserves the birth-to-lineage-to-gallery loop after breeding', async () => {
    const initialCount = useClawStore.getState().claws.length;

    renderApp();

    await screen.findByText(/ClawPark/i);
    clickClawCard('Sage');
    clickClawCard('Bolt');
    fireEvent.click(screen.getByRole('button', { name: /Enter Breed Lab/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Initiate Breeding/i }));

    await waitFor(() => {
      expect(useClawStore.getState().screen).toBe('birth');
      expect(useClawStore.getState().breedResult).not.toBeNull();
    });

    act(() => {
      useClawStore.getState().setBirthPhase('complete');
    });

    fireEvent.click(await screen.findByRole('button', { name: /View Lineage/i }));

    expect(await screen.findByText(/Lineage/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save child to gallery/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Save child to gallery/i }));

    await waitFor(() => {
      expect(useClawStore.getState().screen).toBe('gallery');
      expect(useClawStore.getState().claws).toHaveLength(initialCount + 1);
      expect(useClawStore.getState().selectedIds).toEqual([]);
    });
  });
});
