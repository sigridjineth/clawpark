import { useEffect, useMemo } from 'react';
import { BirthScene } from './components/Birth/BirthScene';
import { BreedLab } from './components/BreedLab/BreedLab';
import { Gallery } from './components/Gallery/Gallery';
import { LineageGraph } from './components/Lineage/LineageGraph';
import { Marketplace } from './components/Marketplace/Marketplace';
import { getSelectedClaws, useClawStore } from './store/useClawStore';
import type { Claw } from './types/claw';
import { attachDemoShortcut, isDemoModeFromSearch, updateDemoModeQuery } from './utils/demoMode';

const SCREENS = ['gallery', 'breedLab', 'birth', 'lineage', 'marketplace'] as const;

function App() {
  const {
    claws,
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
    claimMarketplaceClaw,
    importClaws,
  } = useClawStore();

  const selectedClaws = useMemo(() => getSelectedClaws(claws, selectedIds), [claws, selectedIds]);

  useEffect(() => {
    setDemoMode(isDemoModeFromSearch());
    return attachDemoShortcut(toggleDemoMode);
  }, [setDemoMode, toggleDemoMode]);

  useEffect(() => {
    updateDemoModeQuery(demoMode);
  }, [demoMode]);

  useEffect(() => {
    if (demoMode && screen === 'gallery' && selectedIds.length === 0) {
      loadDemoPair();
    }
  }, [demoMode, loadDemoPair, screen, selectedIds.length]);

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

  const currentIndex = SCREENS.indexOf(screen);

  return (
    <div className="min-h-screen bg-jungle-950 text-bone">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4 md:px-8 md:py-6">
        {/* Minimal header */}
        <header className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setScreen('gallery')}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber/20 bg-jungle-800">
              <span className="text-lg">🧬</span>
            </div>
            <h1 className="font-display text-2xl leading-none text-bone md:text-3xl">ClawPark</h1>
          </button>

          <div className="flex items-center gap-2">
            {/* Step dots */}
            <div className="hidden items-center gap-1 sm:flex">
              {SCREENS.filter((s) => s !== 'marketplace').map((s, i) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all ${
                    s === screen
                      ? 'w-6 bg-amber'
                      : i < currentIndex && screen !== 'marketplace'
                        ? 'w-2 bg-fern'
                        : 'w-2 bg-jungle-700'
                  }`}
                />
              ))}
            </div>

            <span className="jp-pill ml-2">{claws.length} specimens</span>

            <button
              type="button"
              onClick={toggleDemoMode}
              className={`rounded-md border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                demoMode
                  ? 'border-amber-dark bg-amber text-jungle-950'
                  : 'border-jungle-600 bg-jungle-800 text-bone-dim hover:border-fern/40'
              }`}
            >
              Demo {demoMode ? 'On' : 'Off'}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1">
          {screen === 'gallery' && (
            <Gallery
              claws={claws}
              selectedIds={selectedIds}
              onSelect={selectClaw}
              onContinue={() => setScreen('breedLab')}
              onMarketplace={() => setScreen('marketplace')}
              demoMode={demoMode}
            />
          )}

          {screen === 'marketplace' && (
            <Marketplace
              ownedClaws={claws}
              onClaim={claimMarketplaceClaw}
              onImport={importClaws}
              onBack={() => setScreen('gallery')}
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
              onBack={() => setScreen('gallery')}
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
              onBackToGallery={() => setScreen('gallery')}
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
                    Save child to gallery
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
