export type ShapeModifier =
  | 'symmetric'
  | 'tentacle'
  | 'angular'
  | 'grid'
  | 'fragmented'
  | 'organic'
  | 'geometric'
  | 'spiral'
  | 'crystalline';

export interface VisualSymbol {
  shapeModifier: ShapeModifier;
  description: string;
}

export interface SoulTrait {
  id: string;
  label: string;
  description: string;
  weight: number;
  color: string;
  visualSymbol: VisualSymbol;
}

export interface SkillBadge {
  id: string;
  label: string;
  icon: string;
  dominance: number;
  color: string;
}

export interface ToolBadge {
  id: string;
  label: string;
  icon: string;
  description: string;
  potency: number;
  color: string;
}

export interface ClawIdentity {
  creature: string;
  role: string;
  directive: string;
  vibe: string;
  emoji: string;
}

export interface ClawUserContext {
  note: string;
  influence: string;
}

export interface ClawVisual {
  primaryColor: string;
  secondaryColor: string;
  shapeModifiers: ShapeModifier[];
  pattern: 'solid' | 'gradient' | 'stripe' | 'dot' | 'wave';
  glowIntensity: number;
}

export type TraitOrigin = 'parentA' | 'parentB' | 'both' | 'mutation';
export type InheritanceKind = 'inherited' | 'dominant' | 'fused' | 'mutation';

export interface InheritanceRecord {
  type: 'identity' | 'soul' | 'skill' | 'tool';
  traitId: string;
  label: string;
  origin: TraitOrigin;
  originWeight?: number;
  kind?: InheritanceKind;
  detail?: string;
}

export interface ConversationTurn {
  id: string;
  speaker: 'user' | 'parentA' | 'parentB' | 'fusion';
  title: string;
  content: string;
}

export interface ChildDoctrine {
  title: string;
  creed: string;
  summary: string;
}

export interface ClawLineage {
  parentA: string;
  parentB: string;
  inheritanceMap: InheritanceRecord[];
  breedingConversation?: ConversationTurn[];
  doctrine?: ChildDoctrine;
}

export interface Claw {
  id: string;
  name: string;
  archetype: string;
  generation: number;
  identity?: ClawIdentity;
  soul: {
    traits: SoulTrait[];
  };
  skills: {
    badges: SkillBadge[];
  };
  tools?: {
    loadout: ToolBadge[];
  };
  userContext?: ClawUserContext;
  visual: ClawVisual;
  intro: string;
  lineage: ClawLineage | null;
}

export interface BreedRequest {
  parentA: Claw;
  parentB: Claw;
  preferredTraitId?: string;
  seed?: number;
  demoMode?: boolean;
  breedCount?: number;
  breedPrompt?: string;
  breedingConversation?: ConversationTurn[];
}

export interface BreedResult {
  child: Claw;
  inheritanceMap: InheritanceRecord[];
  mutationOccurred: boolean;
  mutatedTrait?: SoulTrait | SkillBadge | ToolBadge;
  eliminatedSoulIds: string[];
  eliminatedSkillIds: string[];
  eliminatedToolIds: string[];
}

export interface TraitPrediction {
  traitId: string;
  label: string;
  probability: number;
  type?: 'soul' | 'skill' | 'tool';
  source: 'parentA' | 'parentB' | 'both';
}

export interface BreedPrediction {
  traitPredictions: TraitPrediction[];
  mutationChance: number;
  predictedArchetype: string;
  dimensionForecast?: {
    identity: string;
    soul: string;
    skills: string;
    tools: string;
  };
}

export type BirthPhase =
  | 'idle'
  | 'merge'
  | 'blend'
  | 'birth'
  | 'reveal_name'
  | 'reveal_archetype'
  | 'reveal_traits'
  | 'reveal_intro'
  | 'complete';

export type Screen = 'home' | 'import' | 'nursery' | 'breedLab' | 'birth' | 'lineage' | 'exchange' | 'connect';

export interface ArchetypeEntry {
  traitComboKey: string;
  name: string;
  introTemplate: string;
}
