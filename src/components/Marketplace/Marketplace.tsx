import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BadgePlus, Download, LogIn, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import {
  buildClawTalkProfile,
  getClawIdentity,
  summarizeSkills,
  summarizeSoul,
  summarizeTools,
} from '../../engine/openclaw';
import {
  createMarketplaceDraft,
  downloadMarketplaceArtifact,
  getDiscordAuthUrl,
  getMarketplaceListings,
  getMarketplaceSession,
  installMarketplaceSkill,
  MarketplaceApiError,
  publishMarketplaceDraft,
  updateMarketplaceDraft,
} from '../../services/marketplaceApi';
import { MARKETPLACE_SEED_LISTINGS } from '../../services/marketplaceSeed';
import type { Claw } from '../../types/claw';
import type { MarketplaceDraft, MarketplaceListing, MarketplaceSession, MarketplaceSkillListing } from '../../types/marketplace';
import { downloadBlobFile, exportAllClaws, exportClaw, parseClawImport } from '../../utils/clawIO';
import { ClawAvatar } from '../shared/ClawAvatar';

interface MarketplaceProps {
  ownedClaws: Claw[];
  onClaim: (claw: Claw) => void;
  onImport: (claws: Claw[]) => void;
  onBack: () => void;
}

type MarketplaceTab = 'browse' | 'publish';
type BrowseKind = 'claw' | 'skill';

function trustTone(listing: MarketplaceListing) {
  return listing.trust === 'verified'
    ? 'border-fern/30 bg-fern/10 text-fern'
    : 'border-amber/30 bg-amber/10 text-amber';
}

function publisherLabel(listing: MarketplaceListing) {
  return listing.publisher.kind === 'discord'
    ? listing.publisher.discordHandle || listing.publisher.displayName
    : listing.publisher.displayName;
}

function installTargetPath(skill: MarketplaceSkillListing) {
  return skill.installHint.replace(/^Install into\s+/i, '').trim() || `./skills/${skill.skill.slug}`;
}

function localSkillSnippet(skill: MarketplaceSkillListing) {
  const target = installTargetPath(skill);
  return [
    `mkdir -p ${target}`,
    `unzip ${skill.slug}.skill.zip -d ${target}`,
  ].join('\n');
}

export function Marketplace({ ownedClaws, onClaim, onImport, onBack }: MarketplaceProps) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const ownedIds = useMemo(() => new Set(ownedClaws.map((claw) => claw.id)), [ownedClaws]);

  const [tab, setTab] = useState<MarketplaceTab>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('marketplace') === 'publish' ? 'publish' : 'browse';
  });
  const [browseKind, setBrowseKind] = useState<BrowseKind>('claw');
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
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [overwriteInstallSlug, setOverwriteInstallSlug] = useState<string | null>(null);

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

  const filteredListings = useMemo(
    () => listings.filter((listing) => listing.kind === browseKind),
    [browseKind, listings],
  );

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
      if (uploadRef.current) uploadRef.current.value = '';
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
      setBrowseKind('claw');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to publish draft.');
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadListing = async (listing: MarketplaceListing) => {
    if (!listing.bundleDownloadUrl) {
      setStatusMessage('Download is only available when the live marketplace API is online.');
      return;
    }

    try {
      const extension = listing.kind === 'skill' ? '.skill.zip' : '.bundle.json';
      const artifact = await downloadMarketplaceArtifact(listing.slug, `${listing.slug}${extension}`);
      downloadBlobFile(artifact.blob, artifact.filename);
      setStatusMessage(`Downloaded ${listing.title}.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to download bundle.');
    }
  };

  const handleCopyInstallHint = async (listing: MarketplaceSkillListing) => {
    const text = `${listing.installHint}\n${localSkillSnippet(listing)}`;
    try {
      await navigator.clipboard.writeText(text);
      setStatusMessage(`Copied install steps for ${listing.title}.`);
    } catch {
      setStatusMessage('Clipboard access is unavailable in this browser.');
    }
  };

  const handleInstallListing = async (listing: MarketplaceSkillListing, overwrite = false) => {
    setInstallingSlug(listing.slug);
    try {
      const result = await installMarketplaceSkill(listing.slug, overwrite);
      setOverwriteInstallSlug((current) => (current === listing.slug ? null : current));
      setStatusMessage(
        `${result.overwritten ? 'Overwrote' : 'Installed'} ${listing.title} into ${result.installedPath}.`,
      );
    } catch (error) {
      if (error instanceof MarketplaceApiError && error.status === 409) {
        setOverwriteInstallSlug(listing.slug);
        setStatusMessage(error.message);
        return;
      }

      setOverwriteInstallSlug((current) => (current === listing.slug ? null : current));
      setStatusMessage(
        error instanceof Error
          ? `${error.message} Download the bundle or copy install steps instead.`
          : 'Failed to install skill. Download the bundle or copy install steps instead.',
      );
    } finally {
      setInstallingSlug(null);
    }
  };

  const marketplaceOrigin = window.location.origin;

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
              Browse published claws and skills, or publish a verified Claw workspace through Discord sign-in.
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
        <div className="grid gap-3 xl:grid-cols-[1.45fr_1fr]">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setBrowseKind('claw')} className={browseKind === 'claw' ? 'jp-btn' : 'jp-btn-secondary'}>
                Browse Claws
              </button>
              <button type="button" onClick={() => setBrowseKind('skill')} className={browseKind === 'skill' ? 'jp-btn' : 'jp-btn-secondary'}>
                Browse Skills
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {filteredListings.map((listing) => {
                if (listing.kind === 'skill') {
                  return (
                    <article key={listing.slug} className="jp-card flex flex-col gap-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-2xl text-bone">{listing.title}</h3>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${trustTone(listing)}`}>
                              {listing.trust === 'verified' ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-amber">Skill bundle</div>
                          <div className="mt-1 text-xs text-bone-muted">{publisherLabel(listing)} · {listing.publisherMode === 'local-skill' ? 'Local skill publish' : 'Managed publish'}</div>
                        </div>
                        <Sparkles className="h-5 w-5 text-amber" />
                      </div>

                      <p className="text-sm text-bone-muted">{listing.summary}</p>

                      <div className="space-y-2 text-sm text-bone-dim">
                        <p><span className="text-bone">Entrypoint.</span> {listing.skill.entrypoint}</p>
                        <p><span className="text-bone">Scripts.</span> {listing.skill.scriptFiles.length ? listing.skill.scriptFiles.join(', ') : 'None'}</p>
                        <p><span className="text-bone">Assets.</span> {listing.skill.assetFiles.length ? listing.skill.assetFiles.join(', ') : 'None'}</p>
                      </div>

                      <div className="rounded-md border border-jungle-700 bg-jungle-900/70 px-3 py-2 text-xs text-bone-dim">
                        {listing.installHint}
                      </div>

                      <div className="mt-auto flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleInstallListing(listing)}
                          className="jp-btn flex-1 text-xs"
                          disabled={installingSlug === listing.slug}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          {installingSlug === listing.slug ? 'Installing…' : 'Install here'}
                        </button>
                        <button type="button" onClick={() => void handleDownloadListing(listing)} className="jp-btn flex-1 text-xs" disabled={!listing.bundleDownloadUrl}>
                          <Download className="h-3.5 w-3.5" />
                          Download Skill
                        </button>
                        <button type="button" onClick={() => void handleCopyInstallHint(listing)} className="jp-btn-secondary flex-1 text-xs">
                          Copy install steps
                        </button>
                        {overwriteInstallSlug === listing.slug && (
                          <button
                            type="button"
                            onClick={() => void handleInstallListing(listing, true)}
                            className="jp-btn-secondary flex-1 text-xs"
                            disabled={installingSlug === listing.slug}
                          >
                            Overwrite install
                          </button>
                        )}
                      </div>
                    </article>
                  );
                }

                const owned = ownedIds.has(listing.claw.id);
                const identity = getClawIdentity(listing.claw);

                return (
                  <article key={listing.slug} className="jp-card flex flex-col gap-4 p-4">
                    <div className="flex items-start gap-3">
                      <ClawAvatar visual={listing.claw.visual} name={listing.claw.name} size={84} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-2xl text-bone">{listing.title}</h3>
                          <span className="jp-pill">v{listing.currentVersion.version}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${trustTone(listing)}`}>
                            {listing.trust === 'verified' ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                        <div className="text-sm text-amber">{listing.claw.archetype}</div>
                        <div className="mt-1 text-xs text-bone-muted">
                          {identity.emoji} {identity.creature} · {publisherLabel(listing)}
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

                    {listing.trust === 'unsigned' && (
                      <div className="rounded-md border border-amber/20 bg-amber/10 px-3 py-2 text-xs text-amber">
                        Published via local skill without marketplace authentication. Treat as unverified.
                      </div>
                    )}

                    <div className="mt-auto flex flex-wrap gap-2">
                      <button type="button" onClick={() => onClaim(listing.claw)} className="jp-btn flex-1 text-xs" disabled={owned}>
                        {owned ? 'Owned' : 'Claim'}
                      </button>
                      <button type="button" onClick={() => void handleDownloadListing(listing)} className="jp-btn-secondary flex-1 text-xs" disabled={!listing.bundleDownloadUrl}>
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
          </div>

          <aside className="jp-card space-y-4 p-5 text-sm text-bone-dim">
            <div>
              <div className="jp-label">Registry contract</div>
              <h3 className="mt-2 font-display text-3xl text-bone">Verified vs local</h3>
            </div>
            <p>
              Verified claw listings come from the Discord-authenticated draft flow. Local skill publishing can add both claws and standalone skills directly to the shared registry, but those listings are marked <span className="text-amber">Unverified</span> and are create-only.
            </p>
            <ul className="space-y-2">
              <li>• Claw listings can be claimed into the gallery.</li>
              <li>• Skill listings can install directly into the local OpenClaw skills directory when the marketplace API is running on this machine.</li>
              <li>• Unsigned local-skill publish never overwrites an existing listing.</li>
            </ul>
          </aside>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-[1.05fr_1fr]">
          <section className="jp-card space-y-4 p-5">
            <div>
              <div className="jp-label">Managed publish</div>
              <h3 className="mt-2 font-display text-3xl text-bone">Verified Claw listing</h3>
              <p className="mt-2 text-sm text-bone-muted">
                Sign in with Discord, upload an OpenClaw workspace ZIP, review the draft, then publish a verified claw listing.
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
                      <p className="text-xs text-amber">Discord OAuth is not configured on this server yet. Local-skill publish can still write unverified listings.</p>
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
                    <button type="button" onClick={() => uploadRef.current?.click()} className="jp-btn" disabled={busy}>
                      <BadgePlus className="h-4 w-4" />
                      Upload workspace ZIP
                    </button>
                    <input
                      ref={uploadRef}
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

            {draft && (
              <div className="space-y-4 rounded-lg border border-jungle-700 bg-jungle-900/70 p-4">
                <div className="flex items-start gap-3">
                  <ClawAvatar visual={draft.claw.visual} name={draft.claw.name} size={84} />
                  <div>
                    <div className="text-xs uppercase tracking-[0.35em] text-bone-muted">Draft preview</div>
                    <div className="font-display text-2xl text-bone">{draft.claw.name}</div>
                    <div className="text-sm text-amber">{draft.claw.archetype}</div>
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

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void saveDraft()} className="jp-btn-secondary" disabled={busy}>
                    Save draft
                  </button>
                  <button type="button" onClick={() => void publishDraft()} className="jp-btn" disabled={busy}>
                    Publish verified listing
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="jp-card space-y-4 p-5">
            <div>
              <div className="jp-label">Local skill bridge</div>
              <h3 className="mt-2 font-display text-3xl text-bone">Moltbot-style publish</h3>
              <p className="mt-2 text-sm text-bone-muted">
                Install the publisher skill into your real OpenClaw workspace. It can upload either the current claw workspace or a standalone skill folder directly into the marketplace as an unverified listing.
              </p>
            </div>

            <div className="rounded-lg border border-jungle-700 bg-jungle-900/70 p-4 text-sm text-bone-dim">
              <div className="text-xs uppercase tracking-[0.35em] text-bone-muted">Install</div>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-bone">cp -R integrations/openclaw-marketplace-publisher ./skills/marketplace-publisher{'\n'}# shared fallback: ~/.openclaw/skills/marketplace-publisher</pre>
            </div>

            <div className="rounded-lg border border-jungle-700 bg-jungle-900/70 p-4 text-sm text-bone-dim">
              <div className="text-xs uppercase tracking-[0.35em] text-bone-muted">Environment</div>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-bone">export CLAWPARK_MARKETPLACE_URL={marketplaceOrigin}</pre>
            </div>

            <div className="rounded-lg border border-amber/20 bg-amber/10 p-4 text-xs text-amber">
              Local skill publish is public but unverified. It creates new immutable listings and never edits an existing marketplace entry.
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
