import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, FileUp, Upload, X } from 'lucide-react';
import type { ImportPreview } from '../../types/specimen';

interface ImportProps {
  onImport: (files: File[], discordUserId?: string) => Promise<void>;
  onClaim: (id: string, discordUserId?: string) => Promise<void>;
  importPreviews: ImportPreview[];
  onClearPreview: () => void;
  onDismissPreview: (specimenId: string) => void;
  discordUserId?: string;
}

export function Import({ onImport, onClaim, importPreviews, onClearPreview, onDismissPreview, discordUserId }: ImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const zips = files.filter((f) => f.name.endsWith('.zip') || f.type === 'application/zip');
      if (zips.length === 0) {
        setError('Please select a .zip file exported from OpenClaw.');
        return;
      }
      const target = zips.slice(0, 2);
      setPendingFiles(target);
      setError(null);
      setBusy(true);
      try {
        await onImport(target, discordUserId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed.');
      } finally {
        setBusy(false);
      }
    },
    [onImport, discordUserId],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      const files = Array.from(event.dataTransfer.files);
      void handleFiles(files);
    },
    [handleFiles],
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    void handleFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClaim = async (id: string) => {
    const preview = importPreviews.find((entry) => entry.specimen.id === id);
    if (!preview) return;
    setBusy(true);
    try {
      await onClaim(preview.specimen.id, discordUserId);
      if (importPreviews.length <= 1) {
        setPendingFiles([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      {/* Header card */}
      <div className="jp-card p-5">
        <div className="jp-label">Specimen import</div>
        <h2 className="mt-1 font-display text-[clamp(2rem,5vw,3.4rem)] leading-[0.95] text-white">
          Import OpenClaw
        </h2>
        <p className="mt-2 font-mono text-sm text-[var(--openclaw-muted)]">
          Upload a .zip workspace exported from OpenClaw to add a specimen to your nursery.
        </p>
      </div>

      {/* Drop zone */}
      <motion.div
        className={`flex flex-col items-center gap-4 rounded-[10px] border-2 border-dashed p-10 text-center transition-colors ${
          dragOver
            ? 'border-white/40 bg-white/5'
            : 'border-white/10 hover:border-white/20'
        }`}
        animate={{ borderColor: dragOver ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)' }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <FileUp className="h-10 w-10 text-white/40" />
        <div>
          <p className="font-mono text-[var(--openclaw-text)]">Drag &amp; drop your .zip files here</p>
          <p className="mt-1 font-mono text-sm text-[var(--openclaw-muted)]">or</p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="jp-btn"
          disabled={busy}
        >
          <Upload className="h-4 w-4" />
          {busy ? 'Processing…' : 'Choose files'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pendingFiles.map((f) => (
              <span key={f.name} className="jp-pill text-xs">
                {f.name}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-start gap-3 rounded-[10px] border border-[rgba(235,61,61,0.4)] bg-[rgba(235,61,61,0.12)] px-4 py-3 font-mono text-sm text-[rgba(235,100,100,1)]"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import preview */}
      <AnimatePresence>
        {importPreviews.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="jp-label">Import previews ({importPreviews.length})</div>
              {importPreviews.length > 1 && (
                <button type="button" onClick={onClearPreview} className="jp-btn-secondary text-xs">
                  Clear all
                </button>
              )}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {importPreviews.map((preview) => {
                const claw = preview.specimen.claw;
                const record = preview.importRecord;

                return (
                  <motion.div
                    key={preview.specimen.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="jp-card space-y-4 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="jp-label">Import preview</div>
                        <h3 className="mt-1 font-display text-[28px] leading-6 text-white">{claw.name}</h3>
                        <div className="mt-1 font-mono text-[10px] text-[var(--openclaw-muted)]">
                          {claw.archetype}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDismissPreview(preview.specimen.id)}
                        aria-label={`Close import preview for ${claw.name}`}
                        className="text-[var(--openclaw-muted)] transition-colors hover:text-white"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {claw.identity && (
                        <div
                          className="rounded-[8px] border border-white/10 p-3"
                          style={{ background: 'rgba(0,0,0,0.2)' }}
                        >
                          <div className="jp-label">Identity</div>
                          <p className="mt-2 font-mono text-sm text-[var(--openclaw-text)]">
                            {claw.identity.emoji} {claw.identity.creature} — {claw.identity.vibe}
                          </p>
                          <p className="mt-1 font-mono text-xs text-[var(--openclaw-muted)]">
                            {claw.identity.directive}
                          </p>
                        </div>
                      )}

                      <div
                        className="rounded-[8px] border border-white/10 p-3"
                        style={{ background: 'rgba(0,0,0,0.2)' }}
                      >
                        <div className="jp-label">Soul traits</div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {claw.soul.traits.map((trait) => (
                            <span
                              key={trait.id}
                              className="inline-flex h-5 items-center rounded-[8px] border border-[rgba(171,114,255,0.65)] bg-[rgba(171,114,255,0.19)] px-2 font-mono text-[12px] text-[var(--openclaw-cta)]"
                            >
                              {trait.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div
                        className="rounded-[8px] border border-white/10 p-3"
                        style={{ background: 'rgba(0,0,0,0.2)' }}
                      >
                        <div className="jp-label">Skills</div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {claw.skills.badges.map((skill) => (
                            <span
                              key={skill.id}
                              className="inline-flex h-5 items-center rounded-[8px] border border-[rgba(61,151,235,0.65)] bg-[rgba(61,151,235,0.19)] px-2 font-mono text-[12px] text-[var(--openclaw-cta)]"
                            >
                              {skill.icon} {skill.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      {claw.tools && (
                        <div
                          className="rounded-[8px] border border-white/10 p-3"
                          style={{ background: 'rgba(0,0,0,0.2)' }}
                        >
                          <div className="jp-label">Tools</div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {claw.tools.loadout.map((tool) => (
                              <span
                                key={tool.id}
                                className="inline-flex h-5 items-center rounded-[8px] border border-[rgba(235,194,61,0.65)] bg-[rgba(235,194,61,0.19)] px-2 font-mono text-[12px] text-[var(--openclaw-cta)]"
                              >
                                {tool.icon} {tool.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {record.warnings.length > 0 && (
                      <div
                        className="rounded-[8px] border border-white/20 p-3"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        <div className="mb-2 jp-label">Warnings</div>
                        <ul className="space-y-1">
                          {record.warnings.map((w, i) => (
                            <li key={`${preview.specimen.id}-${i}`} className="flex items-start gap-2 font-mono text-xs text-[var(--openclaw-muted)]">
                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div
                      className="rounded-[8px] border border-white/10 px-3 py-2 font-mono text-xs text-[var(--openclaw-muted)]"
                      style={{ background: 'rgba(0,0,0,0.2)' }}
                    >
                      <span className="text-[var(--openclaw-text)]">Import record: </span>
                      {record.sourceKind ?? 'openclaw_zip'}
                      {record.includedFiles.length ? ` · ${record.includedFiles.length} file(s)` : ''}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => void handleClaim(preview.specimen.id)}
                        className="jp-btn"
                        disabled={busy}
                      >
                        <CheckCircle className="h-4 w-4" />
                        {busy ? 'Claiming…' : 'Claim specimen'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
