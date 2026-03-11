import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, Upload, ShieldCheck, BadgePlus, LogIn } from 'lucide-react';
import {
  buildClawTalkProfile,
  getClawIdentity,
  summarizeSkills,
  summarizeSoul,
  summarizeTools,
} from '../../engine/openclaw';
import type { Claw } from '../../types/claw';
import type { MarketplaceDraft, MarketplaceListing, MarketplaceSession } from '../../types/marketplace';
import {
  createMarketplaceDraft,
  downloadMarketplaceBundle,
  getDiscordAuthUrl,
  getMarketplaceListings,
  getMarketplaceSession,
  publishMarketplaceDraft,
  updateMarketplaceDraft,
} from '../../services/marketplaceApi';
import { MARKETPLACE_SEED_LISTINGS } from '../../services/marketplaceSeed';
import { exportAllClaws, exportClaw, exportClawBundle, parseClawImport } from '../../utils/clawIO';
import { ClawAvatar } from '../shared/ClawAvatar';

interface MarketplaceProps {
  ownedClaws: Claw[];
  onClaim: (claw: Claw) => void;
  onImport: (claws: Claw[]) => void;
  onBack: () => void;
}

type MarketplaceTab = 'browse' | 'publish';

function listingWarning(listing: MarketplaceListing) {
  return listing.manifest.warnings[0] ?? null;
}

export function Marketplace({ ownedClaws, onClaim, onImport, onBack }: MarketplaceProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const ownedIds = useMemo(() => new Set(ownedClaws.map((c) => c.id)), [ownedClaws]);

  const [tab, setTab] = useState<MarketplaceTab>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('marketplace') === 'publish' ? 'publish' : 'browse';
  });
  const [session, setSession] = useState<MarketplaceSession>({ user: null, authConfigured: false });
  const [listings, setListings] = useState<MarketplaceListing[]>(MARKETPLACE_SEED_LISTINGS);
  const [apiNotice, setApiNotice] = useState<string | null>('Marketplace API offline — showing local seed listings.');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<MarketplaceDraft | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSummary, setDraftSummary] = useState('');
  const [toolsVisibility, setToolsVisibility] = useState<'full' | 'summary'>('full');
  const [coverStyle, setCoverStyle] = useState<'avatar' | 'containment-card'>('avatar');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [nextSession, nextListings] = await Promise.all([getMarketplaceSession(), getMarketplaceListings()]);
        if (cancelled) return;
        setSession(nextSession);
        setListings(nextListings.length > 0 ? nextListings : MARKETPLACE_SEED_LISTINGS);
        setApiNotice(nextListings.length > 0 ? null : 'Marketplace API online, but no public listings yet.');
      } catch {
        if (cancelled) return;
        setSession({ user: null, authConfigured: false });
        setListings(MARKETPLACE_SEED_LISTINGS);
        setApiNotice('Marketplace API offline — showing local seed listings.');
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draft) return;
    setDraftTitle(draft.title);
    setDraftSummary(draft.summary);
    setToolsVisibility(draft.manifest.toolsVisibility);
    setCoverStyle(draft.manifest.coverStyle);
  }, [draft]);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseClawImport(String(reader.result));
      if ('error' in parsed) {
        setStatusMessage(parsed.error);
      } else {
        onImport(parsed.claws);
        setStatusMessage(`Imported ${parsed.claws.length} specimen(s) into your gallery.`);
      }
      if (importRef.current) importRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleUploadBundle = async (file: File) => {
    setBusy(true);
    setStatusMessage(null);
    try {
      const nextDraft = await createMarketplaceDraft(file);
      setDraft(nextDraft);
      setTab('publish');
      setStatusMessage('Workspace bundle parsed. Review the draft, then publish.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to parse upload.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const saveDraft = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const nextDraft = await updateMarketplaceDraft(draft.id, {
        title: draftTitle,
        summary: draftSummary,
        toolsVisibility,
        coverStyle,
      });
      setDraft(nextDraft);
      setStatusMessage('Draft updated.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save draft.');
    } finally {
      setBusy(false);
    }
  };

  const publishDraft = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const savedDraft = await updateMarketplaceDraft(draft.id, {
        title: draftTitle,
        summary: draftSummary,
        toolsVisibility,
        coverStyle,
      });
      const listing = await publishMarketplaceDraft(savedDraft.id);
      setDraft(savedDraft);
      setListings((current) => [listing, ...current.filter((item) => item.slug !== listing.slug)]);
      setStatusMessage(`Published ${listing.title} to the marketplace.`);
      setTab('browse');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to publish draft.');
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadListing = async (listing: MarketplaceListing) => {
    try {
      if (listing.bundleDownloadUrl) {
        const bundle = await downloadMarketplaceBundle(listing.slug);
        exportClawBundle(bundle, `${listing.slug}.bundle.json`);
        setStatusMessage(`Downloaded ${listing.title}.`);
        return;
      }

      exportClawBundle({ claw: listing.claw, manifest: listing.manifest }, `${listing.slug}.bundle.json`);
      setStatusMessage(`Downloaded ${listing.title}.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to download bundle.');
    }
  };

  return (
    <section className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-bone-muted transition hover:text-bone">
        <ArrowLeft className="h-4 w-4" />
        Gallery
      </button>

      <div className="jp-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="jp-label">Restricted wing</div>
            <h2 className="mt-1 font-display text-4xl text-bone">Marketplace</h2>
            <p className="mt-2 max-w-2xl text-sm text-bone-muted">
              Publish a real OpenClaw workspace as a public specimen listing, or claim and download published bundles.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => exportAllClaws(ownedClaws)} className="jp-btn-secondary">
              <Download className="h-4 w-4" />
              Export All
            </button>
            <button type="button" onClick={() => importRef.current?.click()} className="jp-btn-secondary">
              <Upload className="h-4 w-4" />
              Import Bundle
            </button>
            <input ref={importRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setTab('browse')} className={tab === 'browse' ? 'jp-btn' : 'jp-btn-secondary'}>
            Browse
          </button>
          <button type="button" onClick={() => setTab('publish')} className={tab === 'publish' ? 'jp-btn' : 'jp-btn-secondary'}>
            Publish
          </button>
        </div>

        {apiNotice && <div className="mt-4 rounded-md border border-amber/20 bg-amber/10 px-3 py-2 text-sm text-amber">{apiNotice}</div>}
        {statusMessage && <div className="mt-3 rounded-md border border-fern/30 bg-fern/10 px-3 py-2 text-sm text-fern">{statusMessage}</div>}
      </div>

      {tab === 'browse' ? (
        <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {listings.map((listing) => {
              const owned = ownedIds.has(listing.claw.id);
              const identity = getClawIdentity(listing.claw);
              const warning = listingWarning(listing);

              return (
                <article key={listing.slug} className="jp-card flex flex-col gap-4 p-4">
                  <div className="flex items-start gap-3">
                    <ClawAvatar visual={listing.claw.visual} name={listing.claw.name} size={84} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-2xl text-bone">{listing.title}</h3>
                        <span className="jp-pill">v{listing.currentVersion.version}</span>
                      </div>
                      <div className="text-sm text-amber">{listing.claw.archetype}</div>
                      <div className="mt-1 text-xs text-bone-muted">
                        {identity.emoji} {identity.creature} · {listing.publisher.discordHandle}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-bone-muted">{listing.summary}</p>

                  <div className="space-y-2 text-sm text-bone-dim">
                    <p><span className="text-bone">Identity.</span> {buildClawTalkProfile(listing.claw).identity}</p>
                    <p><span className="text-bone">Soul.</span> {summarizeSoul(listing.claw)}</p>
                    <p><span className="text-bone">Skills.</span> {summarizeSkills(listing.claw)}</p>
                    <p><span className="text-bone">Tools.</span> {summarizeTools(listing.claw)}</p>
                  </div>

                  {warning && <div className="rounded-md border border-amber/20 bg-amber/10 px-3 py-2 text-xs text-amber">{warning}</div>}

                  <div className="mt-auto flex flex-wrap gap-2">
                    <button type="button" onClick={() => onClaim(listing.claw)} className="jp-btn flex-1 text-xs" disabled={owned}>
                      {owned ? 'Owned' : 'Claim'}
                    </button>
                    <button type="button" onClick={() => handleDownloadListing(listing)} className="jp-btn-secondary flex-1 text-xs">
                      <Download className="h-3.5 w-3.5" />
                      Download Bundle
                    </button>
                    {owned && (
                      <button type="button" onClick={() => exportClaw(listing.claw)} className="jp-btn-secondary text-xs">
                        Export
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="jp-card p-5 text-sm text-bone-dim">
            <div className="jp-label">Registry contract</div>
            <h3 className="mt-2 font-display text-3xl text-bone">Public bundle</h3>
            <p className="mt-3">
              Listings are published as sanitized Claw bundles. Raw OpenClaw workspaces are not exposed. Only Identity, Soul, Tools, and skills/*/SKILL.md are normalized into a public specimen record.
            </p>
            <ul className="mt-4 space-y-2">
              <li>• Claim imports the published specimen into your gallery.</li>
              <li>• Download gives you the normalized bundle JSON.</li>
              <li>• Seed listings appear when the SQLite API is offline.</li>
            </ul>
          </aside>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-[1.1fr_1fr]">
          <section className="jp-card space-y-4 p-5">
            <div>
              <div className="jp-label">Containment intake</div>
              <h3 className="mt-2 font-display text-3xl text-bone">Publish OpenClaw workspace</h3>
              <p className="mt-2 text-sm text-bone-muted">
                Upload a ZIP from your real OpenClaw workspace. The server extracts only public, allowlisted files and creates a draft for review.
              </p>
            </div>

            {!session.user ? (
              <div className="rounded-lg border border-jungle-700 bg-jungle-900/70 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-amber" />
                  <div className="space-y-2">
                    <p className="text-sm text-bone-dim">Publishing requires Discord sign-in. Listings are attributed to your Discord identity and stored in SQLite on the marketplace server.</p>
                    {session.authConfigured ? (
                      <a href={getDiscordAuthUrl()} className="jp-btn inline-flex">
                        <LogIn className="h-4 w-4" />
                        Sign in with Discord
                      </a>
                    ) : (
                      <p className="text-xs text-amber">Discord OAuth is not configured on this server yet. Seed browse mode still works.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-jungle-700 bg-jungle-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.35em] text-bone-muted">Publisher</div>
                  <div className="mt-2 font-display text-2xl text-bone">{session.user.displayName}</div>
                  <div className="text-sm text-bone-muted">{session.user.discordHandle}</div>
                </div>

                <div className="rounded-lg border border-dashed border-amber/30 bg-jungle-900/70 p-4">
                  <div className="text-sm text-bone-dim">Accepted input: ZIP containing IDENTITY.md, SOUL.md, optional TOOLS.md, and skills/*/SKILL.md.</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => fileRef.current?.click()} className="jp-btn" disabled={busy}>
                      <BadgePlus className="h-4 w-4" />
                      Upload workspace ZIP
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".zip,application/zip"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleUploadBundle(file);
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="jp-card space-y-4 p-5">
            <div>
              <div className="jp-label">Draft review</div>
              <h3 className="mt-2 font-display text-3xl text-bone">Specimen preview</h3>
            </div>

            {!draft ? (
              <p className="text-sm text-bone-muted">No draft loaded yet. Upload a workspace ZIP after signing in.</p>
            ) : (
              <>
                <div className="flex items-start gap-3 rounded-lg border border-jungle-700 bg-jungle-900/70 p-4">
                  <ClawAvatar visual={draft.claw.visual} name={draft.claw.name} size={84} />
                  <div className="min-w-0 space-y-2">
                    <div>
                      <div className="text-xs uppercase tracking-[0.35em] text-bone-muted">Parsed specimen</div>
                      <div className="font-display text-2xl text-bone">{draft.claw.name}</div>
                      <div className="text-sm text-amber">{draft.claw.archetype}</div>
                    </div>
                    <p className="text-sm text-bone-dim">{draft.claw.intro}</p>
                  </div>
                </div>

                <label className="block text-sm text-bone-muted">
                  Title
                  <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} className="mt-2 w-full rounded-md border border-jungle-700 bg-jungle-900 px-3 py-2 text-bone outline-none transition focus:border-amber/40" />
                </label>

                <label className="block text-sm text-bone-muted">
                  Summary
                  <textarea value={draftSummary} onChange={(event) => setDraftSummary(event.target.value)} rows={4} className="mt-2 w-full rounded-md border border-jungle-700 bg-jungle-900 px-3 py-2 text-bone outline-none transition focus:border-amber/40" />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-bone-muted">
                    Tools visibility
                    <select value={toolsVisibility} onChange={(event) => setToolsVisibility(event.target.value as 'full' | 'summary')} className="mt-2 w-full rounded-md border border-jungle-700 bg-jungle-900 px-3 py-2 text-bone outline-none transition focus:border-amber/40">
                      <option value="full">Full</option>
                      <option value="summary">Summary</option>
                    </select>
                  </label>
                  <label className="block text-sm text-bone-muted">
                    Cover style
                    <select value={coverStyle} onChange={(event) => setCoverStyle(event.target.value as 'avatar' | 'containment-card')} className="mt-2 w-full rounded-md border border-jungle-700 bg-jungle-900 px-3 py-2 text-bone outline-none transition focus:border-amber/40">
                      <option value="avatar">Avatar</option>
                      <option value="containment-card">Containment card</option>
                    </select>
                  </label>
                </div>

                <div className="rounded-md border border-jungle-700 bg-jungle-900/70 p-4 text-sm text-bone-dim">
                  <p><span className="text-bone">Identity.</span> {buildClawTalkProfile(draft.claw).identity}</p>
                  <p className="mt-2"><span className="text-bone">Soul.</span> {summarizeSoul(draft.claw)}</p>
                  <p className="mt-2"><span className="text-bone">Skills.</span> {summarizeSkills(draft.claw)}</p>
                  <p className="mt-2"><span className="text-bone">Tools.</span> {summarizeTools(draft.claw)}</p>
                </div>

                {draft.manifest.warnings.length > 0 && (
                  <div className="rounded-md border border-amber/20 bg-amber/10 px-3 py-2 text-xs text-amber">
                    {draft.manifest.warnings.join(' ')}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void saveDraft()} className="jp-btn-secondary" disabled={busy}>
                    Save draft
                  </button>
                  <button type="button" onClick={() => void publishDraft()} className="jp-btn" disabled={busy}>
                    Publish listing
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
