import { useRef, useState } from 'react';
import { ArrowLeft, Download, Upload } from 'lucide-react';
import { MARKETPLACE_CLAWS } from '../../data/marketplaceClaws';
import { getClawIdentity } from '../../engine/openclaw';
import type { Claw } from '../../types/claw';
import { exportAllClaws, exportClaw, parseClawImport } from '../../utils/clawIO';
import { ClawAvatar } from '../shared/ClawAvatar';

interface MarketplaceProps {
  ownedClaws: Claw[];
  onClaim: (claw: Claw) => void;
  onImport: (claws: Claw[]) => void;
  onBack: () => void;
}

export function Marketplace({ ownedClaws, onClaim, onImport, onBack }: MarketplaceProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const ownedIds = new Set(ownedClaws.map((c) => c.id));

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseClawImport(reader.result as string);
      if ('error' in result) {
        setImportMsg(result.error);
      } else {
        onImport(result.claws);
        setImportMsg(`Imported ${result.claws.length} specimen(s).`);
      }
      // Reset file input
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <section className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-bone-muted transition hover:text-bone">
        <ArrowLeft className="h-4 w-4" />
        Gallery
      </button>

      {/* Header */}
      <div className="jp-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="jp-label">Restricted wing</div>
            <h2 className="mt-1 font-display text-4xl text-bone">Marketplace</h2>
            <p className="mt-2 text-sm text-bone-muted">Claim rare specimens or import/export your collection.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => exportAllClaws(ownedClaws)}
              className="jp-btn-secondary"
            >
              <Download className="h-4 w-4" />
              Export All
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="jp-btn-secondary"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        </div>
        {importMsg && (
          <div className="mt-3 rounded-md border border-fern/30 bg-fern/10 px-3 py-2 text-sm text-fern">
            {importMsg}
          </div>
        )}
      </div>

      {/* Marketplace grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MARKETPLACE_CLAWS.map((claw) => {
          const owned = ownedIds.has(claw.id);
          const identity = getClawIdentity(claw);

          return (
            <div
              key={claw.id}
              className={`relative flex flex-col gap-3 rounded-lg border p-4 ${
                owned
                  ? 'border-fern/30 bg-jungle-800/60'
                  : 'border-danger/20 bg-jungle-900'
              }`}
            >
              {/* Restricted badge */}
              {!owned && (
                <div className="absolute right-3 top-3 rounded-full bg-danger/20 px-2 py-0.5 text-[10px] font-bold uppercase text-danger">
                  Restricted
                </div>
              )}
              {owned && (
                <div className="absolute right-3 top-3 rounded-full bg-fern/20 px-2 py-0.5 text-[10px] font-bold uppercase text-fern">
                  Owned
                </div>
              )}

              <div className="flex items-start gap-3">
                <ClawAvatar visual={claw.visual} name={claw.name} size={80} />
                <div className="min-w-0">
                  <div className="font-display text-2xl text-bone">{claw.name}</div>
                  <div className="text-sm text-amber">{claw.archetype}</div>
                  <div className="mt-1 text-xs text-bone-muted">{identity.emoji} {identity.creature}</div>
                </div>
              </div>

              <p className="text-sm italic text-bone-dim">"{claw.intro}"</p>

              <div className="flex flex-wrap gap-1.5">
                {claw.soul.traits.map((trait) => (
                  <span key={trait.id} className="rounded-full border border-jungle-600/40 bg-jungle-950 px-2 py-0.5 text-[10px] text-bone-dim">
                    {trait.label}
                  </span>
                ))}
                {claw.skills.badges.map((skill) => (
                  <span key={skill.id} className="rounded-full border border-fern/20 bg-jungle-950 px-2 py-0.5 text-[10px] text-fern">
                    {skill.label}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex gap-2">
                {owned ? (
                  <button
                    type="button"
                    onClick={() => exportClaw(claw)}
                    className="jp-btn-secondary w-full text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onClaim(claw)}
                    className="jp-btn w-full text-xs"
                  >
                    Claim Specimen
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
