# Tech Spec — ClawPark OpenClaw Genome Pass

## Stack
- React 18
- TypeScript
- Zustand
- Framer Motion
- Tailwind CSS
- Vite
- Vitest + Testing Library

## Domain model

### Claw
A Claw includes:
- `identity`
- `soul.traits`
- `skills.badges`
- `tools.loadout`
- `lineage`

### Lineage
`ClawLineage` now stores:
- `parentA`
- `parentB`
- `inheritanceMap`
- `breedingConversation?: ConversationTurn[]`
- `doctrine?: ChildDoctrine`

### ConversationTurn
Stores one line of breeding dialogue:
- `id`
- `speaker` (`user`, `parentA`, `parentB`, `fusion`)
- `title`
- `content`

### ChildDoctrine
Stores the child’s operating principle:
- `title`
- `creed`
- `summary`

## Breed pipeline

1. Select parent A and parent B.
2. Compute prediction over Soul traits.
3. Optionally set preferred Soul trait.
4. Generate parent dialogue with `buildBreedingConversation()`.
5. Breed with:
   - soul inheritance
   - skill inheritance
   - tool inheritance
   - mutation
   - identity fusion
6. Generate doctrine with `buildChildDoctrine()`.
7. Persist transcript and doctrine into `child.lineage`.

## Core helpers
- `buildClawTalkProfile()`
- `buildBreedingConversation()`
- `buildFusionHint()`
- `buildChildDoctrine()`
- `summarizeSoul()`
- `summarizeSkills()`
- `summarizeTools()`
- `summarizeClawDossier()`

## State management
Zustand store tracks:
- `breedPrompt`
- `breedingConversation`
- `prediction`
- `breedResult`
- screen state
- demo mode

## UI integration points
- **Gallery**: low-text dossier cards
- **Breed Lab**: operator prompt + talk-to-parents + prediction + steering
- **Reveal**: doctrine + transcript + dimension summaries
- **Lineage**: recursive ancestry + transcript + doctrine
- **Marketplace**: claim/import/export scaffolding

## Verification
- `npm run test`
- `npm run lint`
- `npm run build`
