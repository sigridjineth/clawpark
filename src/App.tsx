import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BirthScene } from './components/Birth/BirthScene';
import { BreedLab } from './components/BreedLab/BreedLab';
import { Connect } from './components/Connect/Connect';
import { Home } from './components/Home/Home';
import { Import } from './components/Import/Import';
import { LineageGraph } from './components/Lineage/LineageGraph';
import { Marketplace } from './components/Marketplace/Marketplace';
import { Nursery } from './components/Nursery/Nursery';
import { getSelectedClaws, useClawStore } from './store/useClawStore';
import type { Claw, Screen } from './types/claw';
import { isDemoModeFromSearch } from './utils/demoMode';

const NAV_SCREENS: Array<{ screen: Screen; label: string }> = [
  { screen: 'home', label: 'Home' },
  { screen: 'nursery', label: 'Nursery' },
  { screen: 'exchange', label: 'Marketplace' },
  { screen: 'breedLab', label: 'Lab' },
  { screen: 'import', label: 'Import' },
  { screen: 'connect', label: 'Connect' },
];

const itemBaseClass =
  'relative z-10 inline-flex min-h-9 items-center justify-center rounded-[10px] border border-transparent px-4 py-2 font-mono text-sm leading-5 transition-colors focus-visible:outline-none';

function GlassNavbar({
  activeScreen,
  onNavigate,
}: {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [hovered, setHovered] = useState<Screen | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const highlightedScreen = hovered ?? activeScreen;

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const updateIndicator = useCallback((screen: Screen) => {
    const list = listRef.current;
    const item = itemRefs.current[screen];
    if (!list || !item) return;
    const listRect = list.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    setIndicatorStyle({
      x: itemRect.left - listRect.left,
      y: itemRect.top - listRect.top,
      width: itemRect.width,
      height: itemRect.height,
    });
  }, []);

  useEffect(() => {
    updateIndicator(highlightedScreen);
  }, [highlightedScreen, updateIndicator]);

  useEffect(() => {
    const handleResize = () => updateIndicator(activeScreen);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeScreen, updateIndicator]);

  return (
    <ul
      ref={listRef}
      className="relative flex rounded-[10px] border border-white/10 p-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
      style={{ background: 'var(--openclaw-glass)' }}
      onPointerLeave={() => {
        setHovered(null);
        updateIndicator(activeScreen);
      }}
    >
      {/* Framer-motion animated indicator */}
      {indicatorStyle && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 rounded-[10px] border border-[var(--openclaw-border)] bg-[var(--openclaw-outline)]"
          animate={{
            x: indicatorStyle.x,
            y: indicatorStyle.y,
            width: indicatorStyle.width,
            height: indicatorStyle.height,
          }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 400, damping: 35, mass: 0.8 }
          }
          style={{ position: 'absolute' }}
        />
      )}

      {NAV_SCREENS.map(({ screen, label }) => {
        const isActive = activeScreen === screen;
        const isHighlighted = highlightedScreen === screen;
        return (
          <li key={screen}>
            <button
              ref={(node) => {
                itemRefs.current[screen] = node;
              }}
              type="button"
              onClick={() => onNavigate(screen)}
              onPointerEnter={() => {
                setHovered(screen);
                updateIndicator(screen);
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`${itemBaseClass} bg-transparent ${
                isHighlighted ? 'text-[var(--openclaw-text)]' : 'text-[var(--openclaw-muted)]'
              }`}
            >
              {label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

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
    homePayload,
    importPreviews,
    fetchHome,
    fetchSpecimens,
    importZipFiles,
    claimClaw,
    claimMarketplaceClaw,
    importClaws,
    loadDemoPair,
  } = useClawStore();

  const [homeLoading, setHomeLoading] = useState(true);

  const selectedClaws = useMemo(() => getSelectedClaws(claws, selectedIds), [claws, selectedIds]);

  // Bootstrap data from server
  useEffect(() => {
    setHomeLoading(true);
    void Promise.all([fetchHome(), fetchSpecimens()]).finally(() => setHomeLoading(false));
  }, [fetchHome, fetchSpecimens]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('marketplace')) {
      setScreen('exchange');
      return;
    }

    if (isDemoModeFromSearch(window.location.search)) {
      loadDemoPair();
    }
  }, [loadDemoPair, setScreen]);

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
    useClawStore.setState({ importPreviews: [] });
  }, []);

  const handleDismissPreview = useCallback((specimenId: string) => {
    useClawStore.setState((state) => ({
      importPreviews: state.importPreviews.filter((preview) => preview.specimen.id !== specimenId),
    }));
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black text-[var(--openclaw-text)]">
      {/* Absolute header — matches reference layout exactly */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 mx-auto h-16 w-full sm:h-20">
        {/* Logo — top-left, font-display */}
        <button
          type="button"
          onClick={() => setScreen('home')}
          className="pointer-events-auto absolute left-4 top-4 font-display text-[20px] leading-none text-white sm:text-[24px]"
        >
          ClawPark
        </button>

        {/* Centered glass pill navbar */}
        <nav className="pointer-events-auto absolute left-1/2 top-3 -translate-x-1/2 sm:top-4">
          <GlassNavbar activeScreen={screen} onNavigate={setScreen} />
        </nav>

        {/* Right side: specimen count */}
        <div className="pointer-events-auto absolute right-4 top-3.5 flex items-center gap-2 sm:top-4">
          <span className="inline-flex min-h-9 items-center justify-center rounded-[10px] border border-white/10 px-3 py-2 font-mono text-[11px] text-[var(--openclaw-muted)]" style={{ background: 'var(--openclaw-glass)' }}>
            {claws.length} specimen{claws.length !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      {/* Content — padded below absolute header */}
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-8 pt-24 sm:px-6 sm:pt-28">
        <main className="flex-1">
          <AnimatePresence mode="wait">
            {screen === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Home homePayload={homePayload} loading={homeLoading} onNavigate={setScreen} />
              </motion.div>
            )}

            {screen === 'import' && (
              <motion.div
                key="import"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Import
                  onImport={importZipFiles}
                  onClaim={claimClaw}
                  importPreviews={importPreviews}
                  onClearPreview={handleClearPreview}
                  onDismissPreview={handleDismissPreview}
                  discordUserId={homePayload?.connected_identity?.discordUserId}
                />
              </motion.div>
            )}

            {screen === 'nursery' && (
              <motion.div
                key="nursery"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Nursery
                  claws={claws}
                  specimens={specimens}
                  selectedIds={selectedIds}
                  onSelect={selectClaw}
                  onContinue={() => setScreen('breedLab')}
                />
              </motion.div>
            )}

            {screen === 'connect' && (
              <motion.div
                key="connect"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Connect connectedIdentity={homePayload?.connected_identity ?? null} />
              </motion.div>
            )}

            {screen === 'exchange' && (
              <motion.div
                key="exchange"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Marketplace
                  ownedClaws={claws}
                  onClaim={claimMarketplaceClaw}
                  onImport={importClaws}
                  onBack={() => setScreen('home')}
                />
              </motion.div>
            )}

            {screen === 'breedLab' && parentPair && prediction && (
              <motion.div
                key="breedLab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
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
              </motion.div>
            )}

            {screen === 'birth' && parentPair && breedResult && (
              <motion.div
                key="birth"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <BirthScene
                  parents={parentPair}
                  result={breedResult}
                  phase={birthPhase}
                  onPhaseChange={setBirthPhase}
                  onViewLineage={() => setScreen('lineage')}
                  onBreedAgain={addChildToGallery}
                  onBackToGallery={() => setScreen('nursery')}
                />
              </motion.div>
            )}

            {screen === 'lineage' && parentPair && breedResult && (
              <motion.div
                key="lineage"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <section className="space-y-4">
                  <div className="jp-card flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <h2 className="font-display text-3xl text-white">Lineage</h2>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setScreen('birth')}
                        className="jp-btn-secondary"
                      >
                        Back
                      </button>
                      <button type="button" onClick={addChildToGallery} className="jp-btn">
                        Save to nursery
                      </button>
                    </div>
                  </div>
                  <LineageGraph child={breedResult.child} allClaws={claws} />
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom border line */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-px bg-white/10" />
    </div>
  );
}

export default App;
