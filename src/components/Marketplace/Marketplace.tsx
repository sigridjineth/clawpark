import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BadgePlus, Download, LogIn, Search, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import {
  buildClawTalkProfile,
  getClawIdentity,
  summarizeSkills,
  summarizeSoul,
  summarizeTools,
} from '../../engine/openclaw';
import {
  createMarketplaceDraft,
  createMockMarketplaceListing,
  delistMockMarketplaceListing,
  downloadMarketplaceArtifact,
  getClawProvenance,
  getDiscordAuthUrl,
  getMarketplaceListings,
  getMarketplaceSession,
  installMarketplaceSkill,
  MarketplaceApiError,
  getMockMarketplaceListings,
  getMockMe,
  getMyClawDetail,
  getMyTransactions,
  getMyClaws,
  publishMarketplaceDraft,
  purchaseMockMarketplaceListing,
  relistMockMarketplaceListing,
  runMockBreed,
  updateMarketplaceDraft,
  updateMockMarketplaceListingPrice,
} from '../../services/marketplaceApi';
import { MARKETPLACE_SEED_LISTINGS } from '../../services/marketplaceSeed';
import type { Claw } from '../../types/claw';
import type {
  MarketplaceClawListing,
  MarketplaceDraft,
  MarketplaceListing,
  MarketplaceSession,
  MarketplaceSkillListing,
} from '../../types/marketplace';
import type {
  MockBreedRunResponse,
  MockInventoryResponse,
  MockListingSnapshot,
  MockMeResponse,
  MockProvenanceResponse,
  MockPurchaseResponse,
  MockSpecimenDetailResponse,
  MockTransactionEvent,
} from '../../types/mockCommerce';
import { downloadBlobFile, exportAllClaws, exportClaw, parseClawImport } from '../../utils/clawIO';
import { ClawAvatar } from '../shared/ClawAvatar';

interface MarketplaceProps {
  ownedClaws: Claw[];
  onClaim: (claw: Claw) => void;
  onImport: (claws: Claw[]) => void;
  onBack: () => void;
}

type MarketplaceTab = 'browse' | 'portfolio' | 'publish';
type BrowseKind = 'claw' | 'skill';
type BrowseSort = 'newest' | 'name' | 'price-asc' | 'price-desc' | 'generation-desc' | 'generation-asc';
type ClawBrowseFilter = 'all' | 'registry' | 'published' | 'delisted' | 'sold';
type GenerationFilter = 'all' | 'gen-1' | 'gen-2' | 'gen-3-plus';

interface MarketplaceReceipt {
  title: string;
  summary: string;
  details: string[];
}

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

function isMarketplaceClawListing(listing: MarketplaceListing): listing is MarketplaceClawListing {
  return listing.kind === 'claw';
}

function isMockListingSnapshot(listing: MarketplaceClawListing | MockListingSnapshot): listing is MockListingSnapshot {
  return 'saleState' in listing && 'seller' in listing;
}

function formatReason(code: string | null) {
  switch (code) {
    case 'LISTED_FOR_SALE':
      return 'Listed for sale';
    case 'COOLDOWN_ACTIVE':
      return 'Cooling down';
    case 'NEWBORN_IMPRINTING':
      return 'Newborn imprinting';
    case 'RESERVED_FOR_TRANSFER':
      return 'Reserved for transfer';
    case 'SOLD':
      return 'Sold';
    case 'NOT_OWNED':
      return 'Not owned';
    default:
      return code ?? 'Eligible';
  }
}

function defaultPrice(value?: number | null) {
  return String(value ?? 180);
}

function buildPurchaseReceipt(receipt: MockPurchaseResponse): MarketplaceReceipt {
  return {
    title: 'Purchase receipt',
    summary: receipt.buyerReceipt.summary,
    details: [
      receipt.sellerReceipt.summary,
      `Specimen ${receipt.transfer.specimenId} transferred at ${new Date(receipt.transfer.completedAt).toLocaleString()}.`,
    ],
  };
}

export function Marketplace({ ownedClaws, onClaim, onImport, onBack }: MarketplaceProps) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const galleryClawIds = useMemo(() => new Set(ownedClaws.map((claw) => claw.id)), [ownedClaws]);

  const [tab, setTab] = useState<MarketplaceTab>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('marketplace') === 'publish' ? 'publish' : 'browse';
  });
  const [browseKind, setBrowseKind] = useState<BrowseKind>('claw');
  const [browseQuery, setBrowseQuery] = useState('');
  const [browseSort, setBrowseSort] = useState<BrowseSort>('newest');
  const [clawBrowseFilter, setClawBrowseFilter] = useState<ClawBrowseFilter>('all');
  const [generationFilter, setGenerationFilter] = useState<GenerationFilter>('all');
  const [session, setSession] = useState<MarketplaceSession>({ user: null, authConfigured: false });
  const [listings, setListings] = useState<MarketplaceListing[]>(MARKETPLACE_SEED_LISTINGS);
  const [mockListings, setMockListings] = useState<MockListingSnapshot[]>([]);
  const [me, setMe] = useState<MockMeResponse | null>(null);
  const [myClaws, setMyClaws] = useState<MockInventoryResponse | null>(null);
  const [transactions, setTransactions] = useState<MockTransactionEvent[]>([]);
  const [apiNotice, setApiNotice] = useState<string | null>('Marketplace API offline — showing local seed listings.');
  const [commerceNotice, setCommerceNotice] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<MarketplaceDraft | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSummary, setDraftSummary] = useState('');
  const [toolsVisibility, setToolsVisibility] = useState<'full' | 'summary'>('full');
  const [coverStyle, setCoverStyle] = useState<'avatar' | 'containment-card'>('avatar');
  const [busy, setBusy] = useState(false);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [overwriteInstallSlug, setOverwriteInstallSlug] = useState<string | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [selectedSpecimen, setSelectedSpecimen] = useState<MockSpecimenDetailResponse | null>(null);
  const [selectedProvenance, setSelectedProvenance] = useState<MockProvenanceResponse | null>(null);
  const [selectedSpecimenId, setSelectedSpecimenId] = useState<string | null>(null);
  const [selectedBrowseListing, setSelectedBrowseListing] = useState<MarketplaceListing | MockListingSnapshot | null>(null);
  const [latestReceipt, setLatestReceipt] = useState<MarketplaceReceipt | null>(null);
  const [breedParentA, setBreedParentA] = useState('');
  const [breedParentB, setBreedParentB] = useState('');
  const [breedPrompt, setBreedPrompt] = useState('Raise a resilient child who can survive the park.');
  const [lastBreed, setLastBreed] = useState<MockBreedRunResponse | null>(null);

  const seedPriceDrafts = useCallback((inventory: MockInventoryResponse | null) => {
    if (!inventory) return;
    setPriceDrafts((current) => {
      const next = { ...current };
      for (const item of inventory.items) {
        next[item.specimenId] = next[item.specimenId] ?? defaultPrice(item.market.price?.amount);
      }
      return next;
    });
  }, []);

  const loadBrowseData = useCallback(async () => {
    try {
      const [nextSession, nextListings] = await Promise.all([getMarketplaceSession(), getMarketplaceListings()]);
      setSession(nextSession);
      setListings(nextListings.length > 0 ? nextListings : MARKETPLACE_SEED_LISTINGS);
      setApiNotice(nextListings.length > 0 ? null : 'Marketplace API online, but no registry listings yet.');
    } catch {
      setSession({ user: null, authConfigured: false });
      setListings(MARKETPLACE_SEED_LISTINGS);
      setApiNotice('Marketplace API offline — showing local seed listings.');
    }
  }, []);

  const loadCommerceData = useCallback(async () => {
    try {
      const [nextMe, nextMyClaws, nextTransactions, nextMockListings] = await Promise.all([
        getMockMe(),
        getMyClaws(),
        getMyTransactions(),
        getMockMarketplaceListings(),
      ]);
      setMe(nextMe);
      setMyClaws(nextMyClaws);
      setTransactions(nextTransactions.items);
      setMockListings(nextMockListings);
      setCommerceNotice(null);
      seedPriceDrafts(nextMyClaws);
      if (!breedParentA) {
        const eligible = nextMyClaws.items.filter((item) => item.breeding.isEligible);
        setBreedParentA(eligible[0]?.specimenId ?? '');
        setBreedParentB(eligible[1]?.specimenId ?? '');
      }
    } catch {
      setMe(null);
      setMyClaws(null);
      setTransactions([]);
      setMockListings([]);
      setCommerceNotice('Mock commerce API is unavailable. Browse and publish still work, but inventory/seller/buy/breed mock flows are offline.');
    }
  }, [breedParentA, seedPriceDrafts]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadBrowseData(), loadCommerceData()]);
  }, [loadBrowseData, loadCommerceData]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!draft) return;
    setDraftTitle(draft.title);
    setDraftSummary(draft.summary);
    setToolsVisibility(draft.manifest.toolsVisibility);
    setCoverStyle(draft.manifest.coverStyle);
  }, [draft]);

  const registryClawListings = useMemo(
    () => listings.filter(isMarketplaceClawListing),
    [listings],
  );
  const skillListings = useMemo(
    () => listings.filter((listing): listing is MarketplaceSkillListing => listing.kind === 'skill'),
    [listings],
  );
  const combinedClawListings = useMemo<Array<MarketplaceClawListing | MockListingSnapshot>>(
    () => [...mockListings, ...registryClawListings],
    [mockListings, registryClawListings],
  );
  const normalizedBrowseQuery = browseQuery.trim().toLowerCase();
  const filteredSkillListings = useMemo(() => {
    const filtered = skillListings.filter((listing) => {
      if (!normalizedBrowseQuery) return true;
      const haystack = [
        listing.title,
        listing.summary,
        listing.skill.name,
        listing.skill.description,
        listing.skill.slug,
      ].join(' ').toLowerCase();
      return haystack.includes(normalizedBrowseQuery);
    });

    return [...filtered].sort((left, right) => {
      if (browseSort === 'name') return left.title.localeCompare(right.title);
      return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
    });
  }, [browseSort, normalizedBrowseQuery, skillListings]);
  const filteredClawListings = useMemo(() => {
    const filtered = combinedClawListings.filter((listing) => {
      const haystack = isMockListingSnapshot(listing)
        ? [
            listing.claw.name,
            listing.claw.archetype,
            listing.seller.displayName,
            listing.owner.displayName,
            summarizeSoul(listing.claw),
            summarizeSkills(listing.claw),
          ].join(' ').toLowerCase()
        : [
            listing.title,
            listing.summary,
            listing.claw.name,
            listing.claw.archetype,
            publisherLabel(listing),
            summarizeSoul(listing.claw),
            summarizeSkills(listing.claw),
          ].join(' ').toLowerCase();

      if (normalizedBrowseQuery && !haystack.includes(normalizedBrowseQuery)) return false;

      if (generationFilter === 'gen-1' && listing.claw.generation !== 1) return false;
      if (generationFilter === 'gen-2' && listing.claw.generation !== 2) return false;
      if (generationFilter === 'gen-3-plus' && listing.claw.generation < 3) return false;

      if (clawBrowseFilter === 'registry' && isMockListingSnapshot(listing)) return false;
      if (clawBrowseFilter !== 'all' && clawBrowseFilter !== 'registry' && isMockListingSnapshot(listing)) {
        return listing.saleState === clawBrowseFilter;
      }
      if (clawBrowseFilter !== 'all' && clawBrowseFilter !== 'registry' && !isMockListingSnapshot(listing)) {
        return false;
      }

      return true;
    });

    const priceValue = (listing: MarketplaceClawListing | MockListingSnapshot) => {
      if (isMockListingSnapshot(listing)) return listing.price.amount;
      return Number.POSITIVE_INFINITY;
    };

    return [...filtered].sort((left, right) => {
      switch (browseSort) {
        case 'name':
          return left.claw.name.localeCompare(right.claw.name);
        case 'price-asc':
          return priceValue(left) - priceValue(right);
        case 'price-desc':
          return priceValue(right) - priceValue(left);
        case 'generation-asc':
          return left.claw.generation - right.claw.generation;
        case 'generation-desc':
          return right.claw.generation - left.claw.generation;
        case 'newest':
        default: {
          const leftPublishedAt = isMockListingSnapshot(left) ? left.saleLifecycle.publishedAt : left.publishedAt;
          const rightPublishedAt = isMockListingSnapshot(right) ? right.saleLifecycle.publishedAt : right.publishedAt;
          return new Date(rightPublishedAt ?? 0).getTime() - new Date(leftPublishedAt ?? 0).getTime();
        }
      }
    });
  }, [browseSort, clawBrowseFilter, combinedClawListings, generationFilter, normalizedBrowseQuery]);
  const eligibleParents = useMemo(
    () => (myClaws?.items ?? []).filter((item) => item.breeding.isEligible),
    [myClaws],
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
        setStatusMessage(`Imported ${parsed.claws.length} specimen(s) into your nursery.`);
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

  const handleSyncToGallery = (claw: Claw) => {
    onClaim(claw);
    setStatusMessage(`${claw.name} synced into the local nursery.`);
  };

  const handleInspectSpecimen = async (specimenId: string, clawId: string) => {
    setBusy(true);
    setSelectedSpecimenId(specimenId);
    try {
      const [detail, provenance] = await Promise.all([getMyClawDetail(specimenId), getClawProvenance(clawId)]);
      setSelectedSpecimen(detail);
      setSelectedProvenance(provenance);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to load specimen detail.');
    } finally {
      setBusy(false);
    }
  };

  const handleListForSale = async (specimenId: string) => {
    setBusy(true);
    try {
      const amount = Number(priceDrafts[specimenId] ?? '180');
      const listing = await createMockMarketplaceListing({ specimenId, price: { amount } });
      await loadCommerceData();
      setTab('portfolio');
      setStatusMessage(`Listed ${listing.claw.name} for ${listing.price.formatted}.`);
      setLatestReceipt({
        title: 'Listing created',
        summary: `${listing.claw.name} is now published for ${listing.price.formatted}.`,
        details: [
          `Sale state: ${listing.saleState}`,
          `Listing slug: ${listing.slug}`,
        ],
      });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to list specimen.');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdatePrice = async (slug: string, specimenId: string) => {
    setBusy(true);
    try {
      const amount = Number(priceDrafts[specimenId] ?? '180');
      const listing = await updateMockMarketplaceListingPrice(slug, { price: { amount } });
      await loadCommerceData();
      setStatusMessage(`Updated ${listing.claw.name} to ${listing.price.formatted}.`);
      setLatestReceipt({
        title: 'Price updated',
        summary: `${listing.claw.name} is now listed at ${listing.price.formatted}.`,
        details: [
          `Sale state: ${listing.saleState}`,
          `Listing slug: ${listing.slug}`,
        ],
      });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to update price.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelist = async (slug: string) => {
    setBusy(true);
    try {
      const listing = await delistMockMarketplaceListing(slug);
      await loadCommerceData();
      setStatusMessage(`${listing.claw.name} returned to your inventory.`);
      setLatestReceipt({
        title: 'Listing delisted',
        summary: `${listing.claw.name} returned to your inventory.`,
        details: [
          `Sale state: ${listing.saleState}`,
          `Listing slug: ${listing.slug}`,
        ],
      });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to delist specimen.');
    } finally {
      setBusy(false);
    }
  };

  const handleRelist = async (slug: string) => {
    setBusy(true);
    try {
      const listing = await relistMockMarketplaceListing(slug);
      await loadCommerceData();
      setStatusMessage(`${listing.claw.name} relisted for ${listing.price.formatted}.`);
      setLatestReceipt({
        title: 'Listing relisted',
        summary: `${listing.claw.name} relisted for ${listing.price.formatted}.`,
        details: [
          `Sale state: ${listing.saleState}`,
          `Listing slug: ${listing.slug}`,
        ],
      });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to relist specimen.');
    } finally {
      setBusy(false);
    }
  };

  const handleBuyListing = async (slug: string) => {
    setBusy(true);
    try {
      const receipt = await purchaseMockMarketplaceListing(slug);
      await loadCommerceData();
      setTab('portfolio');
      setStatusMessage(receipt.buyerReceipt.summary);
      setLatestReceipt(buildPurchaseReceipt(receipt));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to purchase specimen.');
    } finally {
      setBusy(false);
    }
  };

  const handleRunBreed = async () => {
    if (!breedParentA || !breedParentB) {
      setStatusMessage('Select two eligible parents first.');
      return;
    }
    if (breedParentA === breedParentB) {
      setStatusMessage('Choose two different parents for the mock breed run.');
      return;
    }
    setBusy(true);
    try {
      const result = await runMockBreed({
        parentASpecimenId: breedParentA,
        parentBSpecimenId: breedParentB,
        breedPrompt,
      });
      setLastBreed(result);
      onClaim(result.child.claw);
      await loadCommerceData();
      setStatusMessage(`${result.child.claw.name} was bred and synced into the local nursery.`);
      setTab('portfolio');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to run mock breeding.');
    } finally {
      setBusy(false);
    }
  };

  const marketplaceOrigin = window.location.origin;

  return (
    <section className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-bone-muted transition hover:text-bone">
        <ArrowLeft className="h-4 w-4" />
        Home
      </button>

      <div className="jp-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="jp-label">Restricted wing</div>
            <h2 className="mt-1 font-display text-4xl text-bone">Marketplace</h2>
            <p className="mt-2 max-w-2xl text-sm text-bone-muted">
              Browse the registry, manage your portfolio, buy specimens, or publish a verified Claw workspace through Discord sign-in.
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
          <button type="button" onClick={() => setTab('portfolio')} className={tab === 'portfolio' ? 'jp-btn' : 'jp-btn-secondary'}>
            My Claws
          </button>
          <button type="button" onClick={() => setTab('publish')} className={tab === 'publish' ? 'jp-btn' : 'jp-btn-secondary'}>
            Publish
          </button>
        </div>

        {apiNotice && (
          <div role="status" aria-live="polite" className="mt-4 rounded-md border border-amber/20 bg-amber/10 px-3 py-2 text-sm text-amber">
            {apiNotice}
          </div>
        )}
        {commerceNotice && (
          <div role="status" aria-live="polite" className="mt-3 rounded-md border border-amber/20 bg-jungle-900/70 px-3 py-2 text-sm text-bone-dim">
            {commerceNotice}
          </div>
        )}
        {statusMessage && (
          <div role="status" aria-live="polite" className="mt-3 rounded-md border border-fern/30 bg-fern/10 px-3 py-2 text-sm text-fern">
            {statusMessage}
          </div>
        )}
      </div>

      {tab === 'browse' && (
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

            <div className="jp-card grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
              <label className="block text-xs uppercase tracking-[0.25em] text-bone-muted">
                Search
                <div className="mt-2 flex items-center gap-2 rounded-md border border-jungle-700 bg-jungle-900 px-3 py-2">
                  <Search className="h-4 w-4 text-bone-muted" />
                  <input
                    value={browseQuery}
                    onChange={(event) => setBrowseQuery(event.target.value)}
                    placeholder={browseKind === 'skill' ? 'Search skills, slugs, summaries…' : 'Search names, archetypes, soul, skills…'}
                    className="w-full bg-transparent text-sm text-bone outline-none placeholder:text-bone-muted"
                  />
                </div>
              </label>

              <label className="block text-xs uppercase tracking-[0.25em] text-bone-muted">
                Sort
                <select
                  value={browseSort}
                  onChange={(event) => setBrowseSort(event.target.value as BrowseSort)}
                  className="mt-2 w-full rounded-md border border-jungle-700 bg-jungle-900 px-3 py-2 text-sm text-bone outline-none transition focus:border-amber/40"
                >
                  <option value="newest">Newest</option>
                  <option value="name">Name</option>
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                  <option value="generation-desc">Generation ↓</option>
                  <option value="generation-asc">Generation ↑</option>
                </select>
              </label>

              <label className="block text-xs uppercase tracking-[0.25em] text-bone-muted">
                Sale State
                <select
                  value={clawBrowseFilter}
                  onChange={(event) => setClawBrowseFilter(event.target.value as ClawBrowseFilter)}
                  className="mt-2 w-full rounded-md border border-jungle-700 bg-jungle-900 px-3 py-2 text-sm text-bone outline-none transition focus:border-amber/40"
                  disabled={browseKind === 'skill'}
                >
                  <option value="all">All</option>
                  <option value="registry">Registry only</option>
                  <option value="published">Published</option>
                  <option value="delisted">Delisted</option>
                  <option value="sold">Sold</option>
                </select>
              </label>

              <label className="block text-xs uppercase tracking-[0.25em] text-bone-muted">
                Generation
                <select
                  value={generationFilter}
                  onChange={(event) => setGenerationFilter(event.target.value as GenerationFilter)}
                  className="mt-2 w-full rounded-md border border-jungle-700 bg-jungle-900 px-3 py-2 text-sm text-bone outline-none transition focus:border-amber/40"
                  disabled={browseKind === 'skill'}
                >
                  <option value="all">All gens</option>
                  <option value="gen-1">Gen 1</option>
                  <option value="gen-2">Gen 2</option>
                  <option value="gen-3-plus">Gen 3+</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {browseKind === 'skill'
                ? filteredSkillListings.map((listing) => (
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
                          onClick={() => setSelectedBrowseListing(listing)}
                          className="jp-btn-secondary flex-1 text-xs"
                        >
                          Inspect
                        </button>
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
                  ))
                : filteredClawListings.map((listing) => {
                    if (isMockListingSnapshot(listing)) {
                      const mine = me?.userId === listing.owner.userId;
                      const inGallery = galleryClawIds.has(listing.claw.id);
                      return (
                        <article key={listing.slug} className="jp-card flex flex-col gap-4 p-4">
                          <div className="flex items-start gap-3">
                            <ClawAvatar visual={listing.claw.visual} name={listing.claw.name} size={84} />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-display text-2xl text-bone">{listing.claw.name}</h3>
                                <span className="jp-pill">{listing.saleState}</span>
                              </div>
                              <div className="text-sm text-amber">{listing.claw.archetype}</div>
                              <div className="mt-1 text-xs text-bone-muted">
                                Seller {listing.seller.displayName} · Owner {listing.owner.displayName}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm text-bone-dim">
                            <p><span className="text-bone">Price.</span> {listing.price.formatted}</p>
                            <p><span className="text-bone">Breed state.</span> {listing.breedStatus.isEligible ? 'Eligible' : formatReason(listing.breedStatus.reasonCode)}</p>
                            <p><span className="text-bone">Soul.</span> {summarizeSoul(listing.claw)}</p>
                            <p><span className="text-bone">Skills.</span> {summarizeSkills(listing.claw)}</p>
                          </div>

                          <div className="mt-auto flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedBrowseListing(listing)}
                              className="jp-btn-secondary text-xs"
                            >
                              Inspect
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleBuyListing(listing.slug)}
                              className="jp-btn flex-1 text-xs"
                              disabled={busy || listing.saleState !== 'published' || mine}
                            >
                              {mine ? 'Owned by You' : `Buy ${listing.price.formatted}`}
                            </button>
                            {mine && !inGallery && (
                              <button type="button" onClick={() => handleSyncToGallery(listing.claw)} className="jp-btn-secondary text-xs">
                                Add to Gallery
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    }

                    const owned = galleryClawIds.has(listing.claw.id);
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
                          <button
                            type="button"
                            onClick={() => setSelectedBrowseListing(listing)}
                            className="jp-btn-secondary text-xs"
                          >
                            Inspect
                          </button>
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
              {browseKind === 'skill' && filteredSkillListings.length === 0 && (
                <div className="jp-card p-5 text-sm text-bone-dim">No skill listings match your current search.</div>
              )}
              {browseKind === 'claw' && filteredClawListings.length === 0 && (
                <div className="jp-card p-5 text-sm text-bone-dim">No claw listings match your current filters.</div>
              )}
            </div>
          </div>

          <aside className="jp-card space-y-4 p-5 text-sm text-bone-dim">
            <div>
              <div className="jp-label">Registry contract</div>
              <h3 className="mt-2 font-display text-3xl text-bone">Verified vs mock commerce</h3>
            </div>
            <p>
              Verified claw listings come from the Discord-authenticated draft flow. The mock commerce layer adds seller state, buy flows, portfolio inventory, and provenance so the frontend can exercise the next CryptoKitties-style milestone before production persistence is finalized.
            </p>
            <ul className="space-y-2">
              <li>• Browse the old registry and the new mock sale listings side by side.</li>
              <li>• Buy published mock listings and see them move into <span className="text-bone">My Claws</span>.</li>
              <li>• Use portfolio actions to list, delist, relist, and breed owned specimens.</li>
              <li>• Skill listings can install directly into the local OpenClaw skills directory when the marketplace API is running on this machine.</li>
            </ul>

            {selectedBrowseListing && (
              <div className="rounded-lg border border-jungle-700 bg-jungle-900/70 p-4">
                <div className="jp-label">Selected listing</div>
                {'kind' in selectedBrowseListing && selectedBrowseListing.kind === 'skill' ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <h4 className="font-display text-2xl text-bone">{selectedBrowseListing.title}</h4>
                      <p className="mt-1 text-sm text-bone-muted">{selectedBrowseListing.summary}</p>
                    </div>
                    <div className="space-y-2 text-sm text-bone-dim">
                      <p><span className="text-bone">Slug.</span> {selectedBrowseListing.skill.slug}</p>
                      <p><span className="text-bone">Entrypoint.</span> {selectedBrowseListing.skill.entrypoint}</p>
                      <p><span className="text-bone">Scripts.</span> {selectedBrowseListing.skill.scriptFiles.length ? selectedBrowseListing.skill.scriptFiles.join(', ') : 'None'}</p>
                      <p><span className="text-bone">References.</span> {selectedBrowseListing.skill.referenceFiles.length ? selectedBrowseListing.skill.referenceFiles.join(', ') : 'None'}</p>
                    </div>
                    <div className="rounded-md border border-jungle-700 bg-jungle-950 px-3 py-2 text-xs text-bone-dim">
                      {selectedBrowseListing.installHint}
                    </div>
                  </div>
                ) : isMockListingSnapshot(selectedBrowseListing) ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <h4 className="font-display text-2xl text-bone">{selectedBrowseListing.claw.name}</h4>
                      <p className="mt-1 text-sm text-amber">{selectedBrowseListing.claw.archetype}</p>
                    </div>
                    <div className="space-y-2 text-sm text-bone-dim">
                      <p><span className="text-bone">Sale state.</span> {selectedBrowseListing.saleState}</p>
                      <p><span className="text-bone">Price.</span> {selectedBrowseListing.price.formatted}</p>
                      <p><span className="text-bone">Seller.</span> {selectedBrowseListing.seller.displayName}</p>
                      <p><span className="text-bone">Owner.</span> {selectedBrowseListing.owner.displayName}</p>
                      <p><span className="text-bone">Generation.</span> Gen {selectedBrowseListing.claw.generation}</p>
                      <p><span className="text-bone">Soul.</span> {summarizeSoul(selectedBrowseListing.claw)}</p>
                      <p><span className="text-bone">Skills.</span> {summarizeSkills(selectedBrowseListing.claw)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div>
                      <h4 className="font-display text-2xl text-bone">{selectedBrowseListing.title}</h4>
                      <p className="mt-1 text-sm text-amber">{selectedBrowseListing.claw.archetype}</p>
                    </div>
                    <div className="space-y-2 text-sm text-bone-dim">
                      <p><span className="text-bone">Publisher.</span> {publisherLabel(selectedBrowseListing)}</p>
                      <p><span className="text-bone">Trust.</span> {selectedBrowseListing.trust}</p>
                      <p><span className="text-bone">Generation.</span> Gen {selectedBrowseListing.claw.generation}</p>
                      <p><span className="text-bone">Identity.</span> {buildClawTalkProfile(selectedBrowseListing.claw).identity}</p>
                      <p><span className="text-bone">Soul.</span> {summarizeSoul(selectedBrowseListing.claw)}</p>
                      <p><span className="text-bone">Skills.</span> {summarizeSkills(selectedBrowseListing.claw)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      )}

      {tab === 'portfolio' && (
        <div className="grid gap-3 xl:grid-cols-[1.35fr_1fr]">
          <section className="space-y-3">
            <div className="jp-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="jp-label">Portfolio</div>
                  <h3 className="mt-2 font-display text-3xl text-bone">My Claws</h3>
                  <p className="mt-2 text-sm text-bone-muted">See owned specimens, manage listings, run mock breeding, and sync purchased or newborn claws into the local nursery.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-jungle-700 bg-jungle-900/70 px-4 py-3 text-sm text-bone-dim">
                    <div className="text-xs uppercase tracking-[0.35em] text-bone-muted">Owned</div>
                    <div className="mt-2 font-display text-2xl text-bone">{me?.portfolio.ownedCount ?? myClaws?.counts.owned ?? 0}</div>
                  </div>
                  <div className="rounded-lg border border-jungle-700 bg-jungle-900/70 px-4 py-3 text-sm text-bone-dim">
                    <div className="text-xs uppercase tracking-[0.35em] text-bone-muted">Listed</div>
                    <div className="mt-2 font-display text-2xl text-bone">{me?.portfolio.listedCount ?? myClaws?.counts.listed ?? 0}</div>
                  </div>
                  <div className="rounded-lg border border-jungle-700 bg-jungle-900/70 px-4 py-3 text-sm text-bone-dim">
                    <div className="text-xs uppercase tracking-[0.35em] text-bone-muted">Breedable</div>
                    <div className="mt-2 font-display text-2xl text-bone">{me?.portfolio.breedableCount ?? 0}</div>
                  </div>
                  <div className="rounded-lg border border-jungle-700 bg-jungle-900/70 px-4 py-3 text-sm text-bone-dim">
                    <div className="text-xs uppercase tracking-[0.35em] text-bone-muted">Cooldown</div>
                    <div className="mt-2 font-display text-2xl text-bone">{me?.portfolio.cooldownCount ?? myClaws?.counts.cooldown ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(myClaws?.items ?? []).map((item) => {
                const inGallery = galleryClawIds.has(item.claw.id);
                const priceDraft = priceDrafts[item.specimenId] ?? defaultPrice(item.market.price?.amount);
                return (
                  <article key={item.specimenId} className="jp-card flex flex-col gap-4 p-4">
                    <div className="flex items-start gap-3">
                      <ClawAvatar visual={item.claw.visual} name={item.claw.name} size={80} />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-2xl text-bone">{item.claw.name}</h3>
                          <span className="jp-pill">{item.market.saleState}</span>
                        </div>
                        <div className="text-sm text-amber">{item.claw.archetype}</div>
                        <div className="mt-1 text-xs text-bone-muted">{item.sourceKind} · {item.location}</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-bone-dim">
                      <p><span className="text-bone">Owner.</span> {item.owner.displayName}</p>
                      <p><span className="text-bone">Breed state.</span> {item.breeding.isEligible ? 'Eligible' : formatReason(item.breeding.reasonCode)}</p>
                      {item.breeding.cooldownEndsAt && (
                        <p><span className="text-bone">Cooldown ends.</span> {new Date(item.breeding.cooldownEndsAt).toLocaleString()}</p>
                      )}
                      <p><span className="text-bone">Soul.</span> {summarizeSoul(item.claw)}</p>
                    </div>

                    <label className="block text-xs uppercase tracking-[0.25em] text-bone-muted">
                      Sale price
                      <input
                        value={priceDraft}
                        onChange={(event) => setPriceDrafts((current) => ({ ...current, [item.specimenId]: event.target.value }))}
                        className="mt-2 w-full rounded-md border border-jungle-700 bg-jungle-900 px-3 py-2 text-sm text-bone outline-none transition focus:border-amber/40"
                        inputMode="numeric"
                      />
                    </label>

                    <div className="mt-auto flex flex-wrap gap-2">
                      {item.market.saleState === 'published' && item.market.listingSlug ? (
                        <>
                          <button type="button" onClick={() => void handleUpdatePrice(item.market.listingSlug!, item.specimenId)} className="jp-btn text-xs" disabled={busy}>
                            Update Price
                          </button>
                          <button type="button" onClick={() => void handleDelist(item.market.listingSlug!)} className="jp-btn-secondary text-xs" disabled={busy}>
                            Delist
                          </button>
                        </>
                      ) : item.market.saleState === 'delisted' && item.market.listingSlug ? (
                        <button type="button" onClick={() => void handleRelist(item.market.listingSlug!)} className="jp-btn text-xs" disabled={busy}>
                          Relist
                        </button>
                      ) : item.market.saleState === 'not_listed' ? (
                        <button type="button" onClick={() => void handleListForSale(item.specimenId)} className="jp-btn text-xs" disabled={busy}>
                          List for Sale
                        </button>
                      ) : null}

                      <button type="button" onClick={() => handleInspectSpecimen(item.specimenId, item.claw.id)} className="jp-btn-secondary text-xs" disabled={busy}>
                        Inspect
                      </button>
                      <button type="button" onClick={() => handleSyncToGallery(item.claw)} className="jp-btn-secondary text-xs" disabled={inGallery}>
                        {inGallery ? 'In Nursery' : 'Add to Nursery'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="space-y-3">
            <section className="jp-card space-y-4 p-5">
              <div>
                <div className="jp-label">Mock breed loop</div>
                <h3 className="mt-2 font-display text-3xl text-bone">Breed owned specimens</h3>
              </div>
              <label className="block text-sm text-bone-muted">
                Parent A
                <select value={breedParentA} onChange={(event) => setBreedParentA(event.target.value)} className="mt-2 w-full rounded-md border border-jungle-700 bg-jungle-900 px-3 py-2 text-bone outline-none transition focus:border-amber/40">
                  <option value="">Select a parent</option>
                  {eligibleParents.map((item) => (
                    <option key={item.specimenId} value={item.specimenId}>{item.claw.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-bone-muted">
                Parent B
                <select value={breedParentB} onChange={(event) => setBreedParentB(event.target.value)} className="mt-2 w-full rounded-md border border-jungle-700 bg-jungle-900 px-3 py-2 text-bone outline-none transition focus:border-amber/40">
                  <option value="">Select a parent</option>
                  {eligibleParents.map((item) => (
                    <option key={item.specimenId} value={item.specimenId}>{item.claw.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-bone-muted">
                Operator prompt
                <textarea value={breedPrompt} onChange={(event) => setBreedPrompt(event.target.value)} rows={3} className="mt-2 w-full rounded-md border border-jungle-700 bg-jungle-900 px-3 py-2 text-bone outline-none transition focus:border-amber/40" />
              </label>
              <button type="button" onClick={() => void handleRunBreed()} className="jp-btn w-full justify-center" disabled={busy || eligibleParents.length < 2}>
                Run Mock Breed
              </button>
              {lastBreed && (
                <div className="rounded-lg border border-fern/30 bg-fern/10 p-4 text-sm text-bone-dim">
                  <div className="font-display text-2xl text-bone">{lastBreed.child.claw.name}</div>
                  <p className="mt-2">Newborn synced into your local nursery. Next actions: {lastBreed.nextActions.join(' · ')}</p>
                </div>
              )}
            </section>

            <section className="jp-card space-y-4 p-5">
              <div>
                <div className="jp-label">Transaction feed</div>
                <h3 className="mt-2 font-display text-3xl text-bone">Recent receipts</h3>
              </div>
              <div className="space-y-3 text-sm text-bone-dim">
                {transactions.slice(0, 6).map((event) => (
                  <div key={event.eventId} className="rounded-lg border border-jungle-700 bg-jungle-900/70 p-3">
                    <div className="text-xs uppercase tracking-[0.25em] text-bone-muted">{event.eventType.replace(/_/g, ' ')}</div>
                    <p className="mt-2 text-bone">{event.summary}</p>
                    <div className="mt-2 text-xs text-bone-muted">{new Date(event.occurredAt).toLocaleString()}</div>
                  </div>
                ))}
                {transactions.length === 0 && <p>No transaction history yet.</p>}
              </div>
            </section>

            {latestReceipt && (
              <section className="jp-card space-y-4 p-5">
                <div>
                  <div className="jp-label">Latest marketplace action</div>
                  <h3 className="mt-2 font-display text-3xl text-bone">{latestReceipt.title}</h3>
                </div>
                <p className="text-sm text-bone" role="status" aria-live="polite">{latestReceipt.summary}</p>
                <div className="space-y-2 text-sm text-bone-dim">
                  {latestReceipt.details.map((detail) => (
                    <div key={detail} className="rounded-lg border border-jungle-700 bg-jungle-900/70 p-3">
                      {detail}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(selectedSpecimen || selectedProvenance) && (
              <section className="jp-card space-y-4 p-5">
                <div>
                  <div className="jp-label">Inspection</div>
                  <h3 className="mt-2 font-display text-3xl text-bone">Specimen detail</h3>
                </div>
                {selectedSpecimen && (
                  <div className="space-y-2 text-sm text-bone-dim">
                    <p><span className="text-bone">Selected.</span> {selectedSpecimen.specimen.claw.name}</p>
                    <p><span className="text-bone">Listing.</span> {selectedSpecimen.listing?.saleState ?? 'not listed'}</p>
                    <p><span className="text-bone">Recent activity.</span></p>
                    <ul className="space-y-2">
                      {selectedSpecimen.recentEvents.map((event) => (
                        <li key={event.eventId} className="rounded-lg border border-jungle-700 bg-jungle-900/70 p-3">
                          {event.summary}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedProvenance && selectedSpecimenId === selectedProvenance.specimenId && (
                  <div className="space-y-2 text-sm text-bone-dim">
                    <p><span className="text-bone">Provenance events.</span></p>
                    <ul className="space-y-2">
                      {selectedProvenance.events.slice(0, 5).map((event) => (
                        <li key={event.eventId} className="rounded-lg border border-jungle-700 bg-jungle-900/70 p-3">
                          {event.summary}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </aside>
        </div>
      )}

      {tab === 'publish' && (
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
