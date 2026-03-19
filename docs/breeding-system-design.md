# ClawPark Breeding System Design

## A Comprehensive Guide for Frontend Designers

This document explains how the ClawPark breeding system works end-to-end. It is intended for UI/UX designers who need to understand the mechanics before designing the Breed Lab, Lineage, and Home screens.

---

## 1. Overview: What is Breeding?

Breeding in ClawPark is the process of combining two parent agents to create a new child agent. The child inherits traits from both parents through four genome dimensions:

1. **Identity** — creature, role, directive, vibe, emoji
2. **Soul** — behavioral traits (e.g., caution, curiosity, analysis)
3. **Skills** — capabilities (e.g., testing, strategy, prompting)
4. **Tools** — operational loadout (e.g., search-probe, radar-array)

The child's combination is deterministic but weighted: traits from both parents have a chance to be inherited, with traits appearing in both parents guaranteed to appear in the child. A 5-15% mutation chance can introduce new traits not present in either parent.

Why breeding matters:
- It creates lineage and historical record
- It lets users experiment with trait combinations
- It models agent evolution and adaptation
- It provides a narrative hook for the product (Jurassic Park metaphor)

---

## 2. Four Genome Dimensions

### 2.1 Identity Dimension

**What it is**: The child's personality presentation.

**Components**:
- `creature` — The species/archetype name (e.g., "Archive Raptor", "Signal Raptor")
- `role` — What the agent does (e.g., "Reviewer", "Architect")
- `directive` — Core instruction (e.g., "Review code changes")
- `vibe` — Emotional tone (e.g., "Sharp", "Patient")
- `emoji` — Visual symbol (e.g., 🦖, ✨)

**How it's determined**:
- Derived primarily from the child's Soul traits
- Lead trait (strongest trait) determines creature type
- Lead skill (dominant skill) determines role
- Combination of traits determines vibe and emoji
- Cannot be inherited as-is; always generated fresh based on the child's actual traits

**UI Implication**: Identity is the "reveal" moment. It's shown after the child is born, not predicted beforehand.

### 2.2 Soul Dimension

**What it is**: Core behavioral principles and traits.

**Structure**:
- Each Soul trait has: `id, label, description, weight (0–1), color, visualSymbol`
- Visual symbols have shape modifiers (spiral, geometric, crystalline, etc.)

**Example traits**:
- `trait-caution` — Patient, risk-aware thinking
- `trait-curiosity` — Restless, explores questions
- `trait-analysis` — Methodical examination
- `mutation-leap-logic` — Jumps to insights (mutation only)

**How it works**:
- Parents have 3-4 soul traits each
- Child inherits typically 3-4 traits
- Traits present in BOTH parents are guaranteed in child
- Other traits have weighted probability based on parent trait weight
- Mutation can add one new trait (not in either parent)

**Weight system**:
- Traits with weight 0.8+ are "strong"
- Traits with weight <0.5 are "weak"
- Inheritance picks strong traits more often
- Mutation replaces the weakest trait

**UI Implication**: Soul is the core. Show all traits prominently. The Soul trait visualization (shape modifiers) is the visual identity of the agent.

### 2.3 Skills Dimension

**What it is**: Functional capabilities.

**Structure**:
- Each skill badge has: `id, label, icon, dominance (0–1), color`

**Example skills**:
- `skill-testing` — Can verify and validate
- `skill-strategy` — Can plan architectures
- `skill-prompting` — Can invoke language models
- `mutation-swarm` — Can coordinate multiple parallel tasks (mutation only)

**How it works**:
- Parents have 4-6 skill badges each
- Child inherits typically 4-6 skills
- Skills present in BOTH parents are guaranteed
- Other skills inherit by weighted dominance
- Mutation can add one new skill (not in either parent)

**UI Implication**: Skills are presented as "badges" or "icons". Show 3-4 dominant skills prominently, others in secondary view.

### 2.4 Tools Dimension

**What it is**: The agent's operational loadout.

**Structure**:
- Each tool badge has: `id, label, icon, description, potency (0–1), color`

**Example tools**:
- `tool-search-probe` — Queries and discovers
- `tool-radar-array` — Monitors and tracks
- `tool-spark-injector` — Injects creativity
- `tool-sandbox-ward` — Safe execution environment

**How it works**:
- Parents have 2-4 tools each
- Child inherits typically 2-4 tools
- Tools present in BOTH parents are guaranteed
- Other tools inherit by weighted potency
- No mutations for tools
- Tools can be "derived" from skills: certain skill combinations suggest tool preferences

**UI Implication**: Tools are less frequently shown than traits/skills, but important for technical understanding. Show as a loadout section.

---

## 3. Breeding Flow: Step by Step

### Step 1: Parent Selection

User selects two agents from the Nursery.

**What happens**:
- System validates both agents are breedable (not on cooldown, not archived)
- System computes compatibility score
- System generates prediction

**UI shows**:
- Parent A visual and name
- Parent B visual and name
- Compatibility: match score, shared traits, diversity

### Step 2: Prediction

System shows what the child *might* look like before breeding.

**Prediction includes**:
- Top 3 probable soul traits (with probability %)
- Mutation chance (5-15% depending on parent similarity)
- Predicted archetype (e.g., "The Sharp Reviewer")
- Dimension forecast (preview of identity/soul/skills/tools balance)

**How mutation chance is computed**:
- If parents share 3+ soul traits: 15% mutation chance
- If parents share 0 traits: 5% mutation chance
- Otherwise: 10% mutation chance
- User can optionally "prefer" one trait to boost its probability by 50%

**UI shows**:
- Trait probabilities as percentages or bars
- Predicted archetype name
- "Mutation possible" indicator
- "Prefer trait?" button (optional)

### Step 3: Talk to Parents

User optionally enters a prompt to influence the child's doctrine and conversation.

**What happens**:
- System generates a "breeding conversation" between the two parents
- Conversation is shaped by the user's prompt and predicted archetype
- Conversation becomes part of the child's lineage record

**Example conversation**:
```
User: "Make them fast and ambitious"

Parent A: "I bring caution to any venture."
Parent B: "I thrive on exploration."
System (fusion): "The child will inherit velocity from both, tempered by careful consideration."
```

**UI shows**:
- Text input: "What quality should the child embody?"
- Generate button
- Generated conversation preview (read-only)

### Step 4: Breed Execution

User clicks "Breed" and the system creates the child.

**What happens**:
1. System rolls random seed for this breeding
2. Soul trait inheritance: weighted random selection from parent traits
3. Skill badge inheritance: weighted random selection from parent skills
4. Tool inheritance: weighted random selection from parent tools
5. Mutation check: 5-15% chance to replace weakest trait with new mutation
6. Archetype resolution: determine child archetype from final trait/skill combo
7. Identity fusion: derive creature, role, directive, vibe, emoji
8. Visual generation: blend parent colors and shapes
9. Child doctrine: compose child's philosophy/creed from conversation and traits
10. Lineage recording: save all inheritance records

**Duration**: Should feel instant (< 100ms) or have a short animation (1-3 seconds).

**UI shows**:
- Loading/animation state
- "Egg cracking" metaphor (optional)
- Result reveals progressively: name → archetype → traits → intro

### Step 5: Birth/Reveal

Child is revealed with full details.

**Reveal flow**:
1. Child name appears (randomly picked from pool, or "Ember" for demo)
2. Archetype revealed (e.g., "The Sharp Reviewer")
3. Soul traits revealed (animation or cascade)
4. Intro text revealed (child's own voice)

**UI shows**:
- Child visual (blended parent colors + shape modifiers)
- Name
- Archetype
- Soul traits with colors and symbols
- Skills (3-4 dominant)
- Tools (2-3 main)
- Intro (first-person description of heritage)

### Step 6: Lineage Review

User reviews the full breeding result.

**Lineage shows**:
- Parent A and Parent B (with lineage click-through)
- Inheritance map: "trait X came from parent Y" for each trait
- Doctrine: child's creed/philosophy
- Breeding conversation: the talk that shaped the child
- "What changed": mutation indicator (if occurred)

**UI shows**:
- Visual comparison: parent A || child || parent B
- Inheritance map as columns or tree
- Doctrine as a block of text
- Conversation as a dialog/transcript
- Save button, Export button

### Step 7: Save Child

User saves the child to their local collection.

**What happens**:
- Child is written to database
- Lineage is recorded
- Child becomes claimable in Nursery
- Parents go on cooldown (typically 24-48 hours)

**UI shows**:
- "Save to Nursery" button
- Confirmation: "Child saved: [Name]"
- Next action suggestion: "Breed again?" or "View Nursery"

---

## 4. Trait Inheritance: The Algorithm

### 4.1 Soul Trait Inheritance

**Step 1: Merge trait pool**
- List all traits from Parent A with their weights
- List all traits from Parent B with their weights
- If same trait ID appears in both: mark as "both parent" origin, boost score
- Other traits are marked "parentA" or "parentB"

**Step 2: Score traits**
- Traits from both parents: score = 1.0 (guaranteed to appear)
- Traits from one parent: score = trait.weight (0–1)
- Preferred trait (if user selected): multiply score by 1.5

**Step 3: Select child traits**
- Child gets 3-4 soul traits (typically 3)
- Use weighted random selection:
  - "Both parent" traits are guaranteed if count < target
  - Then randomly select from remaining pool by score
  - Traits with higher weight/score are more likely

**Example**:
```
Parent A: [caution (0.8), analysis (0.9)]
Parent B: [curiosity (0.85), creativity (0.7)]

Merged pool:
- caution (weight 0.8, origin: parentA)
- analysis (weight 0.9, origin: parentA)
- curiosity (weight 0.85, origin: parentB)
- creativity (weight 0.7, origin: parentB)

No "both" traits, so select 3 from pool by score:
Likely: [analysis (0.9), curiosity (0.85), caution (0.8)]
Less likely: creativity (0.7)
```

### 4.2 Skill Badge Inheritance

Same algorithm as Soul traits:
- Merge parent skill badges
- Mark "both parent" skills as guaranteed
- Weighted random select others by dominance
- Child gets 4-6 skills (typically 4)

### 4.3 Tool Badge Inheritance

Same algorithm:
- Merge parent tools
- "Both" tools guaranteed
- Weighted random select others
- Child gets 2-4 tools (typically 3)

### 4.4 Mutation

**Trigger**: 5-15% chance computed from parent similarity.

**If mutation occurs**:
1. Decide: mutate soul trait (50%) or skill badge (50%)
2. Pick a mutation from the mutation pool (not already in parents)
3. Replace the weakest trait/badge (lowest weight/dominance) with the mutation
4. Record mutation in lineage

**Mutation pools**:

Soul mutations:
- `mutation-leap-logic` — Jumps from signal to insight
- `mutation-signal-sense` — Hears quiet correlations
- `mutation-dreamforge` — Turns vague sparks into forms

Skill mutations:
- `mutation-swarm` — Coordinates multiple parallel tasks
- `mutation-foresight` — Predicts futures
- `mutation-chaos` — Tames chaos

**Why mutations matter**: They introduce genetic novelty, preventing purely algorithmic inheritance. They feel surprising and exciting.

---

## 5. Archetype Resolution

**What it is**: Determining the child's "role" or "type" from traits and skills.

### 5.1 Exact Archetype Matching

Some trait/skill combinations have precomputed archetypes:
- Example: `[caution, analysis, curiosity]` + `[testing]` = "The Patient Verifier"

If the child's exact trait combo exists in the archetype table, use that.

### 5.2 Generated Archetype (Fallback)

If no exact match:
1. Take lead soul trait → adjective (e.g., "caution" → "Patient")
2. Take lead skill badge → noun (e.g., "testing" → "Verifier")
3. Combine: "The Patient Verifier"

**Adjective by trait**:
- caution → Patient
- curiosity → Restless
- critique → Sharp
- analysis → Signal
- creativity → Wild
- systems → Architectural

**Noun by skill**:
- testing → Verifier
- strategy → Architect
- prompting → Invoker
- debugging → Fixer
- velocity → Builder

### 5.3 Intro Generation

Child gets an auto-generated intro describing their heritage.

**Template** (if no mutation):
```
"I blend [trait1], [trait2], and [skill1] into a style that keeps evolving under pressure."
```

**Template** (if mutation):
```
"I inherited [trait1] from Parent A, [trait2] from Parent B, and a sudden [mutation] — so now I [action]."
```

**UI Implication**: The archetype and intro are revealed after breeding completes. They're the "personality reveal" moment.

---

## 6. Identity Fusion

**What it is**: Creating the child's identity (creature, role, directive, vibe, emoji).

### 6.1 Creature Determination

Each soul trait maps to a creature type:
- `trait-caution` → Archive Raptor 🦖
- `trait-curiosity` → Signal Raptor 🦕
- `trait-critique` → Edge Pterosaur 🪽
- `trait-analysis` → Survey Dilophosaur 📡
- (etc.)

**Process**:
1. Take the lead (first/strongest) soul trait
2. Look up its creature and emoji
3. That becomes the child's creature type

Mutations have their own creatures:
- `mutation-leap-logic` → Storm Chimera 🧬
- `mutation-signal-sense` → Echo Chimera 🧬
- `mutation-dreamforge` → Mythic Chimera 🧬

### 6.2 Role Determination

Each skill maps to a role:
- `skill-review` → Reviewer
- `skill-strategy` → Architect
- `skill-testing` → Verifier
- `skill-debugging` → Fixer
- (etc.)

**Process**:
1. Take the lead (first/dominant) skill badge
2. Look up its role
3. That becomes the child's role

### 6.3 Directive and Vibe

**Directive**: Derived from the child's soul and skill combo.
- Example: "Review code changes" (from Review skill + Caution trait)
- Example: "Explore creative possibilities" (from Creativity trait + Prompting skill)

**Vibe**: A short descriptive word or phrase combining traits.
- Example: "Sharp" (from Critique trait)
- Example: "Patient but Restless" (from Caution + Curiosity)

### 6.4 Inheritance Records

The system records where each identity component came from:

```
{
  type: "identity",
  traitId: "creature-archive-raptor",
  label: "Archive Raptor",
  origin: "parentA",
  kind: "inherited",
  detail: "The creature type was inherited from Parent A's lead trait."
}
```

**UI Implication**: Inheritance records allow users to understand "why does my child have this identity?" The records are shown in the Lineage tab.

---

## 7. Visual Generation

**What it is**: Creating the child's visual appearance (colors, shapes, glow).

### 7.1 Color Blending

**Primary color**: Blend parent A and parent B primary colors 50/50.
- Used for base fill

**Secondary color**: Average the colors of the child's soul traits.
- Used for accents

**Algorithm**: Hex color interpolation in RGB space.

### 7.2 Shape Modifiers

Child's shape modifiers come from their soul traits' visual symbols.

Each soul trait has a shape modifier:
- `spiral` — Electric arcs with momentum
- `geometric` — Pulse rings and target marks
- `fragmented` — Forged shards orbiting core
- `crystalline` — Solid angular facets
- (etc.)

Child gets all of their soul traits' shape modifiers.

**Example**:
- Parent A has: caution (spiral) + analysis (geometric)
- Parent B has: curiosity (organic) + creativity (fragmented)
- Child has: [analysis (geometric), curiosity (organic), analysis (geometric)]
- Child's shapes: [geometric, organic, geometric] (deduplicated)

### 7.3 Pattern Selection

Pattern is chosen based on the child's skill badges:

```
patternIndex = (sum of all skill ID lengths) % 5
pattern = ['solid', 'gradient', 'stripe', 'dot', 'wave'][patternIndex]
```

This is deterministic: same skills always produce same pattern.

### 7.4 Glow Intensity

**If mutation occurred**: glow intensity = 0.82 (bright, energetic)
**If no mutation**: glow intensity = 0.34 (normal, subtle)

Mutations "glow" more to indicate they're special.

**UI Implication**: Visual is the first impression. Make sure colors and shapes are distinct and interesting. Glow intensity adds "electricity" to mutant children.

---

## 8. Prediction System

**What it is**: Showing the user what the child might look like *before* breeding.

### 8.1 Trait Probability

For each trait in both parents:

```
probability = traitScore / totalScoreInPool
```

Where `traitScore` = trait weight (or boosted 1.5x if preferred).

Example:
```
Parent A: [caution (0.8), analysis (0.9)]
Parent B: [curiosity (0.85), creativity (0.7)]

Total score: 0.8 + 0.9 + 0.85 + 0.7 = 3.25

Probabilities:
- analysis: 0.9 / 3.25 = 27.7%
- curiosity: 0.85 / 3.25 = 26.2%
- caution: 0.8 / 3.25 = 24.6%
- creativity: 0.7 / 3.25 = 21.5%
```

**UI shows**: Top 3 as bars with percentages.

### 8.2 Mutation Chance

Formula:
```
sharedTraits = count of traits both parents have
if sharedTraits >= 3: chance = 0.15 (15%)
if sharedTraits == 0: chance = 0.05 (5%)
else: chance = 0.10 (10%)
```

**Intuition**: More similar parents → more likely mutation (genetic instability). Very different parents → less likely mutation.

### 8.3 Predicted Archetype

Take top 3 predicted soul traits + top 3 predicted skills, compute archetype.

**UI shows**: Text like "Predicted: The Sharp Reviewer"

### 8.4 Dimension Forecast

Quick preview of each dimension:
- Identity: predicted creature + role
- Soul: predicted top 2 traits
- Skills: predicted top 2 skills
- Tools: predicted 2-3 tools (derived from skills)

**UI shows**: Brief summary, like:
```
Identity: Signal Reviewer
Soul: Curiosity, Analysis
Skills: Testing, Strategy
Tools: Search Probe, Radar Array
```

---

## 9. 7-Stage Orchestration Lifecycle

This is how breeding requests flow through the system (especially important for Discord):

### Stage 1: Intent Created

User expresses desire to breed.

**In Discord**: "Breed this pair"
**In UI**: Click "Breed" button

System creates a `BreedingIntent` record tracking:
- Source (Discord or UI)
- User identity
- Target specimen IDs (or empty if searching)
- Status: `intent_created`

### Stage 2: Candidate Suggested

If user didn't specify both parents, suggest candidates.

**System**:
- Lists breedable agents
- Shows compatibility with specified parent (if any)
- Returns 1-3 candidates

**Status**: `candidate_suggested`

User picks a candidate (or confirms existing choice).

### Stage 3: Consent Pending

System checks ownership of both parents.

**Ownership relationships**:
- `same-owner` — User owns both → auto-approve
- `same-linked-identity` — User's Discord account owns both → auto-approve
- `cross-owner` — Different users → pending consent
- `unknown-owner` — No owner info → pending consent

If auto-approve: skip to Stage 4.
If pending: send consent request to other owner(s), wait up to 24 hours.

**Status**: `consent_pending` or skip to `eligibility_checked`

### Stage 4: Eligibility Checked

System verifies both agents are valid for breeding:
- Both exist and are not deleted
- Neither is on breeding cooldown
- Neither is archived

**Status**: `eligibility_checked`

### Stage 5: Run Started

System executes the breed:
- Rolls seed
- Computes inheritance
- Applies mutation
- Resolves archetype
- Generates visuals
- Creates child

**Status**: `run_started`

### Stage 6: Result Ready

Child exists, lineage is recorded.

**Status**: `result_ready`

System returns:
- Child ID, name, visual
- Archetype
- Lineage summary

### Stage 7: Saved

User confirms save, child enters Nursery.

**Status**: `saved`

Parents go on cooldown.

---

## 10. Consent Model

### 10.1 When Consent is Required

Consent is required when parents have different owners AND the breeder is not one of those owners.

**Cases**:

| Parent A Owner | Parent B Owner | Breeder | Consent Required? |
|---|---|---|---|
| Alice | Alice | Alice | No (same-owner) |
| Alice | Alice | Bob | **Yes** (cross-owner) |
| Alice | Bob | Alice | No (Alice owns A, linked identity) |
| Alice | Bob | Charlie | **Yes** (cross-owner) |
| null | Bob | Charlie | **Yes** (unknown-owner) |
| null | null | Alice | No (no owners, anonymous) |

### 10.2 Consent Flow

When required:

1. System creates a `BreedingConsent` record
2. Notification sent to the other parent's owner
3. Owner has 24 hours to approve/reject
4. If not responded: expires as "rejected"
5. If approved: breed can proceed
6. If rejected: breeding cancelled

**UI Implication**:
- If pending consent, show "Waiting for approval from [Owner]"
- Show countdown timer (24 hours)
- Allow cancellation anytime

### 10.3 Discord Consent

In Discord:
- Bot notifies requester: "Consent required for Parent B"
- Bot (or system) sends DM to Parent B's owner
- Owner responds in DM or reacts
- Bot updates requester: "Approved! Breeding now..."

---

## 11. Data Model

### Core Types

**Claw**
```
{
  id: string
  name: string
  generation: number
  identity: ClawIdentity
  soul: { traits: SoulTrait[] }
  skills: { badges: SkillBadge[] }
  tools: { loadout: ToolBadge[] }
  visual: ClawVisual
  intro: string
  lineage: ClawLineage
}
```

**SoulTrait**
```
{
  id: string                    // "trait-caution", "mutation-leap-logic"
  label: string                 // "Caution", "Leap Logic"
  description: string
  weight: number                // 0.7–1.0
  color: string                 // hex color
  visualSymbol: VisualSymbol    // { shapeModifier, description }
}
```

**SkillBadge**
```
{
  id: string                    // "skill-testing", "mutation-swarm"
  label: string                 // "Testing", "Swarm Sync"
  icon: string                  // icon name
  dominance: number             // 0.5–1.0
  color: string                 // hex color
}
```

**ToolBadge**
```
{
  id: string                    // "tool-search-probe"
  label: string                 // "Search Probe"
  icon: string
  description: string
  potency: number               // 0.5–1.0
  color: string
}
```

**ClawLineage**
```
{
  parentA: string               // claw ID
  parentB: string               // claw ID
  inheritanceMap: InheritanceRecord[]
  breedingConversation?: ConversationTurn[]
  doctrine?: ChildDoctrine
}
```

**InheritanceRecord**
```
{
  type: "identity" | "soul" | "skill" | "tool"
  traitId: string               // which trait
  label: string                 // trait label
  origin: "parentA" | "parentB" | "both" | "mutation"
  originWeight?: number
  kind?: "inherited" | "dominant" | "fused" | "mutation"
  detail?: string               // human-readable explanation
}
```

**ChildDoctrine**
```
{
  title: string                 // e.g., "Patient Observer"
  creed: string                 // e.g., "I move carefully and question deeply."
  summary: string               // 1-2 sentences about the child's philosophy
}
```

---

## 12. UI Implications and Design Guidelines

### 12.1 Breed Lab Screen

Must support:
- Parent A / Parent B display (side-by-side)
- Compatibility/prediction panel
- Trait probability preview (top 3 traits with %)
- Mutation chance indicator
- "Prefer trait?" button (optional)
- "Talk to parents" prompt input
- "Breed" button (primary action)
- Loading/animation state during breed
- Result card with child name, archetype, visual

### 12.2 Lineage Screen

Must show:
- Parent A visual | Child visual | Parent B visual
- Child's full identity (creature, role, directive, vibe, emoji)
- All soul traits with colors and symbols
- Skills (dominant 3-4)
- Tools (2-3)
- Inheritance map (which trait came from where)
  - Could be columns: "From Parent A" | "From Child" | "From Parent B"
  - Or a tree structure with lines
- Breeding conversation (if recorded)
- Child doctrine (philosophy/creed)
- Mutation indicator (if occurred): "New mutation: [Name]"
- Save/Export buttons

### 12.3 Home Screen

Must display (from `/home` endpoint):
- Connected identity (Discord username if linked)
- Quick stats: X owned agents, Y breedable pairs
- Next action recommendation
- Unsaved newborns (if any)
- Pending imports (if any)
- Breedable pairs (if any)
- Quick buttons: "Import", "Start Breeding"

### 12.4 Nursery Screen

Must show:
- List of claimed local agents
- Card per agent:
  - Visual (child's colors + shapes)
  - Name
  - Creature type + role
  - Soul traits (2-3 prominent)
  - Breedability state (ready, cooldown, archived)
  - Click to view detail
  - Click + select for breeding
- Filter/sort by: name, generation, breedability

### 12.5 Color and Visual Language

**Colors by dimension**:
- Identity: creature emoji color
- Soul: trait colors (use the trait's color field)
- Skills: badge colors
- Tools: tool colors

**Shape language**:
- Soul trait shapes are visual identity (spiral, geometric, crystalline, etc.)
- Show these prominently in birth reveal
- Use in visualization

**Glow**:
- Normal children: subtle glow (0.34 intensity)
- Mutant children: bright energetic glow (0.82 intensity)
- Emphasize mutation as special event

---

## 13. Example Breeding Scenario

User: Alice
Parent A: "Sage" (caution, analysis, testing)
Parent B: "Bolt" (curiosity, creativity, velocity)

### Prediction Phase

Traits:
- analysis: 0.9 / 3.25 = 27.7%
- curiosity: 0.85 / 3.25 = 26.2%
- caution: 0.8 / 3.25 = 24.6%
- creativity: 0.7 / 3.25 = 21.5%

Mutation: 0 shared traits → 5% chance

Predicted archetype: "The Curious Architect"

### Breeding Phase

Roll seed, execute:
1. Soul: [analysis, curiosity, caution] selected
2. Skills: [testing, velocity, strategy] selected (mixed from parents)
3. Tools: [search-probe, launch-rail, radar-array] selected
4. Mutation check: 5% roll → 92% roll → no mutation
5. Archetype: "The Restless Architect" (curiosity is lead, strategy is lead skill)
6. Identity:
   - Creature: "Signal Raptor" (curiosity)
   - Role: "Architect" (strategy)
   - Vibe: "Restless"
   - Emoji: 🦕
7. Visual:
   - Primary: blend Sage's color + Bolt's color
   - Secondary: average analysis, curiosity, caution colors
   - Shapes: [geometric, organic, spiral]
   - Pattern: (sum of skill ID lengths) % 5 = solid
   - Glow: 0.34 (no mutation)
8. Doctrine: "I inherited caution from Sage, curiosity from Bolt, and shaped my strategy with patient audacity."

### Result

Child: "Ember" (generation 2)
- Archetype: The Restless Architect
- Traits: analysis, curiosity, caution
- Skills: testing, velocity, strategy
- Tools: search-probe, launch-rail, radar-array
- Visual: Blended colors with geometric/organic/spiral shapes
- Intro: "I blend curiosity, analysis, and strategy into a style that keeps evolving under pressure."

Lineage:
- analysis → Sage (inherited)
- curiosity → Bolt (inherited)
- caution → Sage (inherited)
- testing → Sage (inherited)
- velocity → Bolt (inherited)
- strategy → mixed (both parents skilled)

---

## 14. Summary for Designers

When designing the UI:

1. **Prediction is preview, not promise** — Show top traits but acknowledge randomness
2. **Mutation is a special event** — Glow, animation, emphasis
3. **Lineage is the narrative** — Make it easy to read "where did trait X come from?"
4. **Identity is revealed, not predicted** — Don't show creature type before breeding
5. **Colors matter** — Use trait colors to visualize soul
6. **Shapes matter** — Soul trait visual symbols are the core visual identity
7. **Conversation adds narrative** — Recording parent talk makes breeding feel personal
8. **Archetype is personality** — Show it proudly, it's the summary of the child
9. **Tools are loadout** — Show them but less prominently than traits/skills
10. **Consent is async** — Can take time; show status clearly

---

## 15. Technical Details for Reference

### Key Files

- `src/engine/breed.ts` — Main breeding orchestration
- `src/engine/inherit.ts` — Trait inheritance algorithm
- `src/engine/mutate.ts` — Mutation system
- `src/engine/predict.ts` — Prediction system
- `src/engine/openclaw.ts` — Identity fusion and doctrine
- `src/engine/visual.ts` — Visual generation
- `src/engine/archetype.ts` — Archetype resolution
- `server/breedingOrchestrator.ts` — 7-stage lifecycle
- `server/breedingConsent.ts` — Consent logic

### Default Parameters

- Child traits: 3-4 (typically 3)
- Child skills: 4-6 (typically 4)
- Child tools: 2-4 (typically 3)
- Mutation chance: 5-15% (based on parent similarity)
- Consent timeout: 24 hours
- Breeding cooldown: varies (typically 24-48 hours)

---

## 16. Glossary

- **Archetype**: The child's role/type (e.g., "The Sharp Reviewer")
- **Breeding**: Creating a child from two parent agents
- **Consent**: Permission required for cross-owner breeding
- **Cooldown**: Waiting period after breeding before breeding again
- **Doctrine**: The child's creed/philosophy
- **Dominance**: Strength of a skill badge (0–1)
- **Genome**: The four dimensions (identity, soul, skills, tools)
- **Inheritance**: How traits pass from parents to child
- **Lineage**: Record of a child's parents and heritage
- **Mutation**: A new trait not present in either parent
- **Potency**: Strength of a tool badge (0–1)
- **Prediction**: Estimate of child traits before breeding
- **Weight**: Strength of a soul trait (0–1)
- **Visual Symbol**: Shape modifier for a trait (spiral, geometric, etc.)

