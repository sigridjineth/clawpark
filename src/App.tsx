import { useCallback, useEffect, useMemo, useState } from 'react';
import { BirthScene } from './components/Birth/BirthScene';
import { BreedLab } from './components/BreedLab/BreedLab';
import { Connect } from './components/Connect/Connect';
import { Home } from './components/Home/Home';
import { Import } from './components/Import/Import';
import { LineageGraph } from './components/Lineage/LineageGraph';
import { Nursery } from './components/Nursery/Nursery';
import { getSelectedClaws, useClawStore } from './store/useClawStore';
import type { Claw, Screen } from './types/claw';
import { attachDemoShortcut, isDemoModeFromSearch, updateDemoModeQuery } from './utils/demoMode';

const NAV_SCREENS: Array<{ screen: Screen; label: string }> = [
  { screen: 'home', label: 'Home' },
  { screen: 'import', label: 'Import' },
  { screen: 'nursery', label: 'Nursery' },
  { screen: 'breedLab', label: 'Lab' },
];

function App() {
  const {
    claws,
    specimens,
    selectedIds,
    selectClaw,
    screen,
    setScreen,
    prediction,
    preferredTraitId,
    breedPrompt,
    breedingConversation,
    setBreedPrompt,
    generateParentConversation,
    setPreferredTrait,
    breedSelected,
    breedResult,
    addChildToGallery,
    birthPhase,
    setBirthPhase,
    demoMode,
    toggleDemoMode,
    setDemoMode,
    loadDemoPair,
    homePayload,
    importPreview,
    fetchHome,
    fetchSpecimens,
    importClaw,
    claimClaw,
  } = useClawStore();

  const [homeLoading, setHomeLoading] = useState(true);

  const selectedClaws = useMemo(() => getSelectedClaws(claws, selectedIds), [claws, selectedIds]);

  useEffect(() => {
    setDemoMode(isDemoModeFromSearch());
    return attachDemoShortcut(toggleDemoMode);
  }, [setDemoMode, toggleDemoMode]);

  useEffect(() => {
    updateDemoModeQuery(demoMode);
  }, [demoMode]);

  useEffect(() => {
    if (demoMode && screen === 'nursery' && selectedIds.length === 0) {
      loadDemoPair();
    }
  }, [demoMode, loadDemoPair, screen, selectedIds.length]);

  // Bootstrap data from server
  useEffect(() => {
    setHomeLoading(true);
    void Promise.all([fetchHome(), fetchSpecimens()]).finally(() => setHomeLoading(false));
  }, [fetchHome, fetchSpecimens]);

  const parentPair = useMemo<[Claw, Claw] | null>(() => {
    if (selectedClaws.length === 2) {
      return [selectedClaws[0], selectedClaws[1]];
    }

    if (breedResult?.child.lineage) {
      const parentA = claws.find((claw) => claw.id === breedResult.child.lineage?.parentA);
      const parentB = claws.find((claw) => claw.id === breedResult.child.lineage?.parentB);
      if (parentA && parentB) {
        return [parentA, parentB];
      }
    }

    return null;
  }, [breedResult, claws, selectedClaws]);

  const handleClearPreview = useCallback(() => {
    useClawStore.setState({ importPreview: null });
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black text-[var(--openclaw-text)]">
      {/* Absolute header — matches reference layout */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 mx-auto h-16 w-full sm:h-20">
        <button
          type="button"
          onClick={() => setScreen('home')}
          className="pointer-events-auto absolute left-4 top-4 font-display text-[20px] leading-none text-white sm:text-[24px]"
        >
          ClawPark
        </button>

        {/* Glass pill nav — centered */}
        <nav className="pointer-events-auto absolute left-1/2 top-3 -translate-x-1/2 sm:top-4">
          <ul
            className="relative flex rounded-[10px] border border-white/10 p-[2px]"
            style={{ background: 'var(--openclaw-glass)' }}
          >
            {NAV_SCREENS.map(({ screen: s, label }) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setScreen(s)}
                  className={`inline-flex min-h-9 items-center justify-center rounded-[10px] border px-4 py-2 font-mono text-sm leading-5 transition-colors ${
                    screen === s
                      ? 'border-[var(--openclaw-border)] bg-[var(--openclaw-outline)] text-[var(--openclaw-text)]'
                      : 'border-transparent text-[var(--openclaw-muted)] hover:text-[var(--openclaw-text)]'
                  }`}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right side: specimen count + demo toggle */}
        <div className="pointer-events-auto absolute right-4 top-3.5 flex items-center gap-2 sm:top-4">
          <span className="jp-pill">{claws.length}</span>
          <button
            type="button"
            onClick={toggleDemoMode}
            className={`inline-flex min-h-9 items-center justify-center rounded-[10px] border px-3 py-2 font-mono text-[11px] transition-colors ${
              demoMode
                ? 'border-white/30 bg-white/15 text-white'
                : 'border-white/10 text-[var(--openclaw-muted)] hover:text-[var(--openclaw-text)]'
            }`}
            style={{ background: demoMode ? undefined : 'var(--openclaw-glass)' }}
          >
            Demo {demoMode ? 'On' : 'Off'}
          </button>
        </div>
      </header>

      {/* Content — padded below absolute header */}
      <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-24 sm:px-6 sm:pt-28">
        <main className="flex-1">
          {screen === 'home' && (
            <Home
              homePayload={homePayload}
              loading={homeLoading}
              onNavigate={setScreen}
            />
          )}

          {screen === 'import' && (
            <Import
              onImport={importClaw}
              onClaim={claimClaw}
              importPreview={importPreview}
              onClearPreview={handleClearPreview}
              discordUserId={homePayload?.connected_identity?.discordUserId}
            />
          )}

          {screen === 'nursery' && (
            <Nursery
              claws={claws}
              specimens={specimens}
              selectedIds={selectedIds}
              onSelect={selectClaw}
              onContinue={() => setScreen('breedLab')}
            />
          )}

          {screen === 'connect' && (
            <Connect
              connectedIdentity={homePayload?.connected_identity ?? null}
            />
          )}

          {screen === 'breedLab' && parentPair && prediction && (
            <BreedLab
              parents={parentPair}
              preferredTraitId={preferredTraitId}
              breedPrompt={breedPrompt}
              breedingConversation={breedingConversation}
              onBreedPromptChange={setBreedPrompt}
              onTalkToParents={generateParentConversation}
              onPreferredTrait={setPreferredTrait}
              onBack={() => setScreen('nursery')}
              onBreed={breedSelected}
              prediction={prediction}
            />
          )}

          {screen === 'birth' && parentPair && breedResult && (
            <BirthScene
              parents={parentPair}
              result={breedResult}
              phase={birthPhase}
              onPhaseChange={setBirthPhase}
              onViewLineage={() => setScreen('lineage')}
              onBreedAgain={addChildToGallery}
              onBackToGallery={() => setScreen('nursery')}
            />
          )}

          {screen === 'lineage' && parentPair && breedResult && (
            <section className="space-y-4">
              <div className="jp-card flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <h2 className="font-display text-3xl text-bone">Lineage</h2>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setScreen('birth')} className="jp-btn-secondary">
                    Back
                  </button>
                  <button type="button" onClick={addChildToGallery} className="jp-btn">
                    Save to nursery
                  </button>
                </div>
              </div>
              <LineageGraph child={breedResult.child} allClaws={claws} />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
