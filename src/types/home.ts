export interface SuggestedAction {
  action: string;
  label: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | string;
  endpoint: string;
  params?: Record<string, string>;
  priority: number;
}

export interface ConnectedIdentity {
  discordUserId: string;
  discordHandle?: string;
}

export interface HomePayload {
  owned_claw_count: number;
  breedable_pairs: number;
  pending_claims: number;
  unsaved_children: number;
  what_to_do_next: string;
  suggested_actions: SuggestedAction[];
  connected_identity: ConnectedIdentity | null;
  onboarding_state: 'none' | 'discord_linked';
}
