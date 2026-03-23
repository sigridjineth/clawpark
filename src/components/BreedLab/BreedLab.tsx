import { ArrowLeft } from 'lucide-react';
import { buildFusionHint } from '../../engine/openclaw';
import type { Claw } from '../../types/claw';
import type { BreedingIntent, BreedingProposal } from '../../types/specimen';
import { BreedButton } from './BreedButton';
import { ParentSlot } from './ParentSlot';
import { PredictionPanel } from './PredictionPanel';

interface BreedLabProps {
  parents: [Claw, Claw];
  preferredTraitId: string | null;
  breedPrompt: string;
  breedingConversation: import('../../types/claw').ConversationTurn[];
  onBreedPromptChange: (prompt: string) => void;
  onTalkToParents: () => void;
  onPreferredTrait: (traitId: string | null) => void;
  onBack: () => void;
  onBreed: () => void;
  onCreateIntent: (sourceMessage: string) => void;
  onCreateProposal: () => void;
  onRespondConsent: (status: 'approved' | 'rejected') => void;
  breedingPending: boolean;
  intentPending: boolean;
  breedingIntent: BreedingIntent | null;
  breedingProposal: BreedingProposal | null;
  prediction: NonNullable<import('../../types/claw').BreedPrediction>;
}

export function BreedLab({
  parents,
  preferredTraitId,
  breedPrompt,
  breedingConversation,
  onBreedPromptChange,
  onTalkToParents,
  onPreferredTrait,
  onBack,
  onBreed,
  onCreateIntent,
  onCreateProposal,
  onRespondConsent,
  breedingPending,
  intentPending,
  breedingIntent,
  breedingProposal,
  prediction,
}: BreedLabProps) {
  const traitPool = Array.from(
    new Map([...parents[0].soul.traits, ...parents[1].soul.traits].map((trait) => [trait.id, trait])).values(),
  );

  return (
    <section className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-bone-muted transition hover:text-bone">
        <ArrowLeft className="h-4 w-4" />
        Nursery
      </button>

      {/* Parents + Prediction */}
      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3 lg:grid-cols-2">
          <ParentSlot claw={parents[0]} label="Parent A" />
          <ParentSlot claw={parents[1]} label="Parent B" />
        </div>
        <PredictionPanel prediction={prediction} />
      </div>

      {/* Fusion hint */}
      <div className="jp-card p-4">
        <div className="jp-label">Fusion forecast</div>
        <p className="mt-2 text-sm leading-relaxed text-bone-dim">
          {buildFusionHint({ parentA: parents[0], parentB: parents[1], predictedArchetype: prediction.predictedArchetype })}
        </p>
      </div>

      {/* Operator prompt */}
      <div className="jp-card p-4">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-fern">Talk to the parents</div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="jp-label">Operator prompt</div>
            <textarea
              value={breedPrompt}
              onChange={(event) => onBreedPromptChange(event.target.value)}
              rows={2}
              className="mt-2 w-full resize-y rounded-md border border-jungle-700/60 bg-jungle-950 px-3 py-2 text-sm text-bone outline-none placeholder:text-bone-muted focus:border-fern/40"
              placeholder="Guide the breeding process..."
            />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={onTalkToParents} className="jp-btn-secondary h-fit">
              Talk to Parents
            </button>
          </div>
        </div>

        {breedingConversation.length > 0 && (
          <div className="mt-3 space-y-2">
            {breedingConversation.map((turn) => (
              <div key={turn.id} className="rounded-md border border-jungle-700/40 bg-jungle-950 px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-fern">{turn.title}</div>
                <div className="mt-1 text-sm text-bone-dim">{turn.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trait bias — compact */}
      <div className="jp-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="jp-label">Trait bias</span>
          <button
            type="button"
            onClick={() => onPreferredTrait(null)}
            className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
              preferredTraitId === null
                ? 'border-amber-dark bg-amber text-jungle-950'
                : 'border-jungle-600 bg-jungle-900 text-bone-dim hover:border-fern/40'
            }`}
          >
            Balanced
          </button>
          {traitPool.map((trait) => (
            <button
              type="button"
              key={trait.id}
              onClick={() => onPreferredTrait(trait.id)}
              className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
                preferredTraitId === trait.id
                  ? 'border-amber-dark bg-amber text-jungle-950'
                  : 'border-jungle-600 bg-jungle-900 text-bone-dim hover:border-fern/40'
              }`}
            >
              {trait.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario 2: intent/proposal/consent flow */}
      <div className="jp-card p-4">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-fern">Scenario 2 flow</div>
        <p className="text-sm text-bone-dim">
          Create a Discord/web breeding intent, convert it to a proposal, then optionally post a consent decision.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCreateIntent(breedPrompt)}
            className="jp-btn-secondary"
            disabled={intentPending}
          >
            {intentPending ? 'Working…' : 'Create Intent'}
          </button>
          <button
            type="button"
            onClick={onCreateProposal}
            className="jp-btn-secondary"
            disabled={intentPending}
          >
            Create Proposal
          </button>
          <button
            type="button"
            onClick={() => onRespondConsent('approved')}
            className="jp-btn-secondary"
            disabled={intentPending || !breedingProposal}
          >
            Consent Approve
          </button>
          <button
            type="button"
            onClick={() => onRespondConsent('rejected')}
            className="jp-btn-secondary"
            disabled={intentPending || !breedingProposal}
          >
            Consent Reject
          </button>
        </div>

        <div className="mt-3 grid gap-2 text-xs text-bone-dim sm:grid-cols-2">
          <div className="rounded-md border border-jungle-700 bg-jungle-950 px-3 py-2">
            <div className="jp-label">Intent</div>
            <div className="mt-1 break-all text-bone">{breedingIntent?.intentId ?? '—'}</div>
            <div className="mt-1">Status: {breedingIntent?.status ?? '—'}</div>
          </div>
          <div className="rounded-md border border-jungle-700 bg-jungle-950 px-3 py-2">
            <div className="jp-label">Proposal</div>
            <div className="mt-1 break-all text-bone">{breedingProposal?.proposalId ?? '—'}</div>
            <div className="mt-1">Consent: {breedingProposal?.consentStatus ?? '—'}</div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <BreedButton onClick={onBreed} disabled={breedingPending} />
      </div>
    </section>
  );
}
