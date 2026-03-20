import { randomUUID } from 'node:crypto';
import type { SqliteDatabase } from './db.ts';
import type { Claw } from '../src/types/claw.ts';

export interface SpecimenRow {
  id: string;
  name: string;
  claw_json: string;
  ownership_state: string;
  breed_state: string;
  discord_user_id: string | null;
  import_record_id: string | null;
  parent_a_id: string | null;
  parent_b_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImportRecordRow {
  id: string;
  source_kind: string;
  uploaded_at: string;
  included_files: string;
  ignored_files: string;
  warnings: string;
  fingerprint: string;
  parsed_specimen_id: string | null;
  discord_user_id: string | null;
}

export interface BreedingRunRow {
  id: string;
  parent_a_id: string;
  parent_b_id: string;
  prompt: string | null;
  conversation_json: string | null;
  prediction_json: string | null;
  result_child_id: string | null;
  status: string;
  saved: number;
  created_at: string;
}

export function createSpecimenStore(db: SqliteDatabase) {
  const CONSENT_TIMEOUT_HOURS = 24;

  const insertImport = db.prepare(`
    INSERT INTO import_records (id, source_kind, uploaded_at, included_files, ignored_files, warnings, fingerprint, parsed_specimen_id, discord_user_id)
    VALUES (?, 'openclaw_zip', ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSpecimen = db.prepare(`
    INSERT INTO specimens (id, name, claw_json, ownership_state, breed_state, discord_user_id, import_record_id, parent_a_id, parent_b_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'ready', ?, ?, ?, ?, ?, ?)
  `);

  const updateSpecimenState = db.prepare(`
    UPDATE specimens SET ownership_state = ?, discord_user_id = COALESCE(?, discord_user_id), updated_at = ? WHERE id = ?
  `);

  const selectSpecimen = db.prepare(`SELECT * FROM specimens WHERE id = ?`);
  const selectAllSpecimens = db.prepare(`SELECT * FROM specimens ORDER BY created_at DESC`);
  const selectImport = db.prepare(`SELECT * FROM import_records WHERE id = ?`);

  const insertBreedingRun = db.prepare(`
    INSERT INTO breeding_runs (id, parent_a_id, parent_b_id, prompt, conversation_json, prediction_json, result_child_id, status, saved, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `);
  const selectBreedingRun = db.prepare(`SELECT * FROM breeding_runs WHERE id = ?`);
  const updateBreedingRun = db.prepare(`UPDATE breeding_runs SET status = ?, result_child_id = ? WHERE id = ?`);

  function rowToSpecimen(row: SpecimenRow) {
    return {
      id: row.id,
      name: row.name,
      claw: JSON.parse(row.claw_json) as Claw,
      ownershipState: row.ownership_state,
      breedState: row.breed_state,
      discordUserId: row.discord_user_id,
      importRecordId: row.import_record_id,
      parentAId: row.parent_a_id,
      parentBId: row.parent_b_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  return {
    importSpecimen(claw: Claw, manifest: { includedFiles: string[]; ignoredFiles: string[]; warnings: string[] }, fingerprint: string, discordUserId?: string) {
      const now = new Date().toISOString();
      const importId = `imp-${randomUUID().slice(0, 8)}`;
      const specimenId = `spec-${randomUUID().slice(0, 8)}`;
      const storedClaw: Claw = {
        ...claw,
        id: specimenId,
      };

      insertImport.run(
        importId, now,
        JSON.stringify(manifest.includedFiles),
        JSON.stringify(manifest.ignoredFiles),
        JSON.stringify(manifest.warnings),
        fingerprint,
        specimenId,
        discordUserId ?? null,
      );

      insertSpecimen.run(
        specimenId, storedClaw.name, JSON.stringify(storedClaw),
        'imported', discordUserId ?? null, importId,
        null, null, now, now,
      );

      return {
        importId,
        specimenId,
        specimen: rowToSpecimen(selectSpecimen.get(specimenId) as unknown as SpecimenRow),
        importRecord: selectImport.get(importId) as unknown as ImportRecordRow,
      };
    },

    claimSpecimen(id: string, discordUserId?: string) {
      const now = new Date().toISOString();
      const row = selectSpecimen.get(id) as unknown as SpecimenRow | undefined;
      if (!row) return null;
      if (row.ownership_state !== 'imported') {
        return { error: `Cannot claim: specimen is already ${row.ownership_state}` };
      }
      updateSpecimenState.run('claimed', discordUserId ?? null, now, id);
      return { specimen: rowToSpecimen(selectSpecimen.get(id) as unknown as SpecimenRow) };
    },

    getSpecimen(id: string) {
      const row = selectSpecimen.get(id) as unknown as SpecimenRow | undefined;
      return row ? rowToSpecimen(row) : null;
    },

    listSpecimens(filter?: { ownershipState?: string; discordUserId?: string }) {
      let rows = selectAllSpecimens.all() as unknown as SpecimenRow[];
      if (filter?.ownershipState) {
        rows = rows.filter(r => r.ownership_state === filter.ownershipState);
      }
      if (filter?.discordUserId) {
        rows = rows.filter(r => r.discord_user_id === filter.discordUserId);
      }
      return rows.map(rowToSpecimen);
    },

    getImportRecord(id: string) {
      const row = selectImport.get(id) as unknown as ImportRecordRow | undefined;
      if (!row) return null;
      return {
        ...row,
        included_files: JSON.parse(row.included_files),
        ignored_files: JSON.parse(row.ignored_files),
        warnings: JSON.parse(row.warnings),
      };
    },

    createBreedingRun(parentAId: string, parentBId: string, prompt?: string) {
      const id = `breed-${randomUUID().slice(0, 8)}`;
      const now = new Date().toISOString();
      insertBreedingRun.run(id, parentAId, parentBId, prompt ?? null, null, null, null, 'pending', now);
      return selectBreedingRun.get(id) as unknown as BreedingRunRow;
    },

    completeBreedingRun(runId: string, childClaw: Claw, discordUserId?: string) {
      const now = new Date().toISOString();
      const run = selectBreedingRun.get(runId) as unknown as BreedingRunRow | undefined;
      if (!run) return null;

      const childId = childClaw.id || `child-${randomUUID().slice(0, 8)}`;
      insertSpecimen.run(
        childId, childClaw.name, JSON.stringify(childClaw),
        'claimed', discordUserId ?? null, null,
        run.parent_a_id, run.parent_b_id, now, now,
      );
      updateBreedingRun.run('complete', childId, runId);

      return {
        run: selectBreedingRun.get(runId) as unknown as BreedingRunRow,
        child: rowToSpecimen(selectSpecimen.get(childId) as unknown as SpecimenRow),
      };
    },

    getBreedingRun(id: string) {
      return selectBreedingRun.get(id) as unknown as BreedingRunRow | undefined ?? null;
    },

    saveBreedingRun(id: string) {
      const run = selectBreedingRun.get(id) as unknown as BreedingRunRow | undefined;
      if (!run) return null;
      db.prepare('UPDATE breeding_runs SET saved = 1 WHERE id = ?').run(id);
      const child = run.result_child_id
        ? rowToSpecimen(selectSpecimen.get(run.result_child_id) as unknown as SpecimenRow)
        : null;
      return { ...run, saved: 1, child };
    },

    getLineage(specimenId: string, maxDepth = 10): unknown {
      const specimen = this.getSpecimen(specimenId);
      if (!specimen || maxDepth <= 0) return specimen ? { specimen, parentA: null, parentB: null } : null;
      return {
        specimen,
        parentA: specimen.parentAId ? this.getLineage(specimen.parentAId, maxDepth - 1) : null,
        parentB: specimen.parentBId ? this.getLineage(specimen.parentBId, maxDepth - 1) : null,
      };
    },

    checkEligibility(parentAId: string, parentBId: string) {
      const a = this.getSpecimen(parentAId);
      const b = this.getSpecimen(parentBId);
      if (!a || !b) return { eligible: false, reason: 'One or both specimens not found' };
      if (!['claimed', 'published'].includes(a.ownershipState)) {
        return { eligible: false, reason: `Parent A is ${a.ownershipState}, must be claimed` };
      }
      if (!['claimed', 'published'].includes(b.ownershipState)) {
        return { eligible: false, reason: `Parent B is ${b.ownershipState}, must be claimed` };
      }
      return { eligible: true, parentA: a, parentB: b };
    },

    countByState() {
      const all = selectAllSpecimens.all() as unknown as SpecimenRow[];
      return {
        total: all.length,
        imported: all.filter(r => r.ownership_state === 'imported').length,
        claimed: all.filter(r => r.ownership_state === 'claimed').length,
        breedable: all.filter(r => ['claimed', 'published'].includes(r.ownership_state) && r.breed_state === 'ready').length,
      };
    },

    countUnsavedChildren() {
      const result = db.prepare(
        `SELECT COUNT(*) as count FROM breeding_runs WHERE saved = 0 AND result_child_id IS NOT NULL AND status = 'complete'`,
      ).get() as { count: number } | undefined;
      return result?.count ?? 0;
    },

    createBreedingIntent(params: {
      sourceSurface: string;
      sourceMessage: string;
      requesterIdentity: string;
      targetSpecimenIds: string[];
    }) {
      const id = `intent-${randomUUID().slice(0, 8)}`;
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO breeding_intents (id, source_surface, source_message, requester_identity, target_specimen_ids, status, suggested_candidates, created_at)
        VALUES (?, ?, ?, ?, ?, 'intent_created', '[]', ?)
      `).run(id, params.sourceSurface, params.sourceMessage, params.requesterIdentity, JSON.stringify(params.targetSpecimenIds), now);
      return db.prepare('SELECT * FROM breeding_intents WHERE id = ?').get(id) as Record<string, unknown>;
    },

    getBreedingIntent(id: string) {
      return db.prepare('SELECT * FROM breeding_intents WHERE id = ?').get(id) as Record<string, unknown> | null;
    },

    createBreedingProposal(params: {
      parentAId: string;
      parentBId: string;
      requesterId: string;
      intentId?: string;
    }) {
      const id = `prop-${randomUUID().slice(0, 8)}`;
      const now = new Date().toISOString();
      const specA = this.getSpecimen(params.parentAId);
      const specB = this.getSpecimen(params.parentBId);
      const ownerA = specA?.discordUserId ?? null;
      const ownerB = specB?.discordUserId ?? null;
      const isAnonymous = params.requesterId === 'anonymous';
      const bothUnowned = ownerA === null && ownerB === null;
      const requesterOwnsA = ownerA === null || ownerA === params.requesterId;
      const requesterOwnsB = ownerB === null || ownerB === params.requesterId;
      const autoApprove = isAnonymous || bothUnowned || (requesterOwnsA && requesterOwnsB);
      const consentStatus = autoApprove ? 'auto_approved' : 'pending';

      db.prepare(`
        INSERT INTO breeding_proposals (id, parent_a_id, parent_b_id, requester_id, consent_status, intent_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, params.parentAId, params.parentBId, params.requesterId, consentStatus, params.intentId ?? null, now);

      if (!autoApprove) {
        const expiresAt = new Date(Date.now() + CONSENT_TIMEOUT_HOURS * 60 * 60 * 1000).toISOString();
        const owners = new Set<string>();
        if (ownerA && ownerA !== params.requesterId) owners.add(ownerA);
        if (ownerB && ownerB !== params.requesterId) owners.add(ownerB);
        for (const owner of owners) {
          db.prepare(`
            INSERT INTO breeding_consents (id, proposal_id, owner_identity, status, responded_at, expires_at)
            VALUES (?, ?, ?, 'pending', NULL, ?)
          `).run(`con-${randomUUID().slice(0, 8)}`, id, owner, expiresAt);
        }
      }

      return db.prepare('SELECT * FROM breeding_proposals WHERE id = ?').get(id) as Record<string, unknown>;
    },

    getBreedingProposal(id: string) {
      return db.prepare('SELECT * FROM breeding_proposals WHERE id = ?').get(id) as Record<string, unknown> | null;
    },

    updateProposalConsent(proposalId: string, status: string) {
      const row = db.prepare('SELECT * FROM breeding_proposals WHERE id = ?').get(proposalId) as Record<string, unknown> | null;
      if (!row) return null;
      const now = new Date().toISOString();
      db.prepare('UPDATE breeding_proposals SET consent_status = ? WHERE id = ?').run(status, proposalId);
      db.prepare('UPDATE breeding_consents SET status = ?, responded_at = ? WHERE proposal_id = ?').run(status, now, proposalId);
      return db.prepare('SELECT * FROM breeding_proposals WHERE id = ?').get(proposalId) as Record<string, unknown>;
    },
  };
}

export type SpecimenStore = ReturnType<typeof createSpecimenStore>;
