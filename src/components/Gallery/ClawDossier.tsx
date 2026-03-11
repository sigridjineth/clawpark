import { X } from 'lucide-react';
import {
  buildClawTalkProfile,
  getClawIdentity,
  getClawTools,
  summarizeClawDossier,
} from '../../engine/openclaw';
import type { Claw } from '../../types/claw';
import { ClawAvatar } from '../shared/ClawAvatar';
import { TraitBadge } from '../shared/TraitBadge';

interface ClawDossierProps {
  claw: Claw;
  selected: boolean;
  onToggleSelect: () => void;
  onClose: () => void;
}

function skillDominanceLabel(value: number) {
  return `${Math.round(value * 100)}% dominance`;
}

export function ClawDossier({ claw, selected, onToggleSelect, onClose }: ClawDossierProps) {
  const identity = getClawIdentity(claw);
  const tools = getClawTools(claw).loadout;
  const talkProfile = buildClawTalkProfile(claw);

  return (
    <section className="jp-card overflow-hidden">
      <div className="grid gap-6 p-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:p-6">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-jungle-700/70 bg-jungle-900/70 p-5">
          <div className="flex w-full items-start justify-between">
            <div>
              <div className="jp-label">Specimen dossier</div>
              <div className="mt-2 text-xs uppercase tracking-[0.32em] text-bone-muted">Gen-{claw.generation}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-jungle-700 p-1.5 text-bone-muted transition hover:border-amber/30 hover:text-bone"
              aria-label={`Close ${claw.name} dossier`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ClawAvatar visual={claw.visual} name={claw.name} size={150} />

          <div className="w-full text-center">
            <h2 className="font-display text-4xl text-bone">{claw.name}</h2>
            <p className="mt-2 text-sm text-amber">{claw.archetype}</p>
            <p className="mt-3 text-sm text-bone-dim">{summarizeClawDossier(claw)}</p>
          </div>

          <button type="button" onClick={onToggleSelect} className="jp-btn w-full">
            {selected ? 'Deselect for breeding' : 'Select for breeding'}
          </button>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-jungle-700/70 bg-jungle-900/60 p-4">
            <div className="jp-label">Identity</div>
            <p className="mt-3 text-base text-bone">{talkProfile.identity}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-bone-muted">Creature</div>
                <div className="mt-2 text-sm text-bone">
                  {identity.emoji} {identity.creature}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-bone-muted">Role</div>
                <div className="mt-2 text-sm text-bone">{identity.role}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-bone-muted">Vibe</div>
                <div className="mt-2 text-sm text-bone">{identity.vibe}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs uppercase tracking-[0.28em] text-bone-muted">Directive</div>
              <div className="mt-2 text-sm text-bone-dim">{identity.directive}</div>
            </div>
          </div>

          <div className="rounded-xl border border-jungle-700/70 bg-jungle-900/60 p-4">
            <div className="jp-label">Soul</div>
            <p className="mt-3 text-base text-bone">{talkProfile.soul}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {claw.soul.traits.map((trait) => (
                <TraitBadge key={trait.id} item={trait} kind="soul" />
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {claw.soul.traits.map((trait) => (
                <div key={trait.id} className="rounded-lg border border-jungle-700 bg-jungle-950/70 p-3">
                  <div className="text-sm font-semibold text-bone">{trait.label}</div>
                  <div className="mt-2 text-xs text-bone-dim">{trait.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-jungle-700/70 bg-jungle-900/60 p-4">
              <div className="jp-label">Skills</div>
              <p className="mt-3 text-base text-bone">{talkProfile.skills}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {claw.skills.badges.map((skill) => (
                  <TraitBadge key={skill.id} item={skill} kind="skill" />
                ))}
              </div>
              <div className="mt-4 space-y-3">
                {claw.skills.badges.map((skill) => (
                  <div key={skill.id} className="rounded-lg border border-jungle-700 bg-jungle-950/70 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-bone">{skill.label}</div>
                      <div className="text-[11px] uppercase tracking-[0.22em] text-bone-muted">
                        {skillDominanceLabel(skill.dominance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-jungle-700/70 bg-jungle-900/60 p-4">
              <div className="jp-label">Tools</div>
              <p className="mt-3 text-base text-bone">{talkProfile.tools}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {tools.map((tool) => (
                  <TraitBadge key={tool.id} item={tool} kind="tool" />
                ))}
              </div>
              <div className="mt-4 space-y-3">
                {tools.map((tool) => (
                  <div key={tool.id} className="rounded-lg border border-jungle-700 bg-jungle-950/70 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-bone">{tool.label}</div>
                      <div className="text-[11px] uppercase tracking-[0.22em] text-bone-muted">
                        {Math.round(tool.potency * 100)}% potency
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-bone-dim">{tool.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
