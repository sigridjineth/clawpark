import { useEffect, useMemo } from 'react';
import { ShieldAlert } from 'lucide-react';
import { BirthScene } from './components/Birth/BirthScene';
import { BreedLab } from './components/BreedLab/BreedLab';
import { Gallery } from './components/Gallery/Gallery';
import { LineageGraph } from './components/Lineage/LineageGraph';
import { getSelectedClaws, useClawStore } from './store/useClawStore';
import type { Claw } from './types/claw';
import { attachDemoShortcut, isDemoModeFromSearch, updateDemoModeQuery } from './utils/demoMode';

const SCREEN_FLOW = [
  { id: 'gallery', label: 'Catalogue' },
  { id: 'breedLab', label: 'Lab' },
  { id: 'birth', label: 'Birth' },
  { id: 'lineage', label: 'Lineage' },
] as const;

function App() {
  const {
    claws,
    selectedIds,
    selectClaw,
    screen,
    setScreen,
    prediction,
    preferredTraitId,
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

  const currentStepIndex = SCREEN_FLOW.findIndex((entry) => entry.id === screen);

  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="fixed inset-x-0 top-0 -z-10 h-[18rem] bg-confetti opacity-90" />
      <div className="mx-auto flex min-h-screen w-full max-w-[88rem] flex-col gap-5 px-3 py-4 md:px-8 md:py-8 lg:px-10">
        <header className="shell-card overflow-hidden px-4 py-4 md:px-7 md:py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] border border-[#c7b587]/20 bg-[linear-gradient(180deg,rgba(22,32,25,0.98),rgba(12,18,14,0.98))] shadow-float md:h-16 md:w-16 md:rounded-[1.15rem]">
                <ShieldAlert className="h-7 w-7 text-butter md:h-8 md:w-8" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.34em] text-[#7d916d]">Containment archive</div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-3xl leading-none text-ink md:text-5xl">ClawPark</h1>
                  <span className="rounded-full border border-[#c7b587]/14 bg-[#172019] px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-[#9eb088]">
                    {claws.length} specimens
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="candy-pill">Containment mode</div>
              <button
                type="button"
                onClick={toggleDemoMode}
                className={`rounded-[0.55rem] border px-4 py-3 text-xs font-bold uppercase tracking-[0.28em] transition ${
                  demoMode
                    ? 'border-[#8c6731] bg-[#d7b36a] text-[#141811] shadow-[0_0.18rem_0_0_#8c6731]'
                    : 'border-[#334239] bg-[#172019] text-[#dfe8c9] hover:bg-[#1a241f]'
                }`}
              >
                Demo {demoMode ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SCREEN_FLOW.map((entry, index) => {
              const active = entry.id === screen;
              const passed = index < currentStepIndex;
              const stepLabel = active && entry.id === 'lineage' ? 'Branch' : entry.label;

              return (
                <div
                  key={entry.id}
                  className={`rounded-[0.9rem] border px-3 py-3 transition md:px-4 md:py-4 ${
                    active
                      ? 'border-[#8c6731] bg-[linear-gradient(180deg,rgba(45,58,47,0.96),rgba(20,28,22,0.96))] shadow-candy'
                      : passed
                        ? 'border-[#334239] bg-[#172019] shadow-glow'
                        : 'border-[#253028] bg-[#101612]'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#7f8e71]">0{index + 1}</div>
                  <div className="mt-2 font-display text-xl leading-none text-ink md:text-2xl">{stepLabel}</div>
                </div>
              );
            })}
          </div>
        </header>

        <main className="flex-1">
          {screen === 'gallery' && (
            <Gallery
              claws={claws}
              selectedIds={selectedIds}
              onSelect={selectClaw}
              onContinue={() => setScreen('breedLab')}
              demoMode={demoMode}
            />
          )}

          {screen === 'breedLab' && parentPair && prediction && (
            <BreedLab
              parents={parentPair}
              preferredTraitId={preferredTraitId}
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
            <section className="space-y-5">
              <div className="shell-card flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8aa07b]">Genome ancestry</div>
                  <div className="mt-2 font-display text-3xl leading-none text-ink">See every branch from this hatch</div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => setScreen('birth')} className="candy-button-secondary">
                    Back to birth
                  </button>
                  <button type="button" onClick={addChildToGallery} className="candy-button">
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
