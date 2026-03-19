// Stub types — worker-1 will replace with authoritative server contract.
// Matches the expected /api/v1/home HomePayload shape.

export interface SuggestedAction {
  id: string;
  label: string;
  description: string;
  cta: string;
  screen: 'import' | 'nursery' | 'breedLab' | 'exchange';
  priority: number;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string>;
}

export interface ConnectedIdentity {
  discordUserId: string;
  discordHandle: string;
  avatarUrl?: string;
  verifiedAt: string;
}

export interface HomePayload {
  owned_claw_count: number;
  breedable_pairs: number;
  pending_claims: number;
  unsaved_children: number;
  what_to_do_next: string;
  suggested_actions: SuggestedAction[];
  connected_identity: ConnectedIdentity | null;
}
