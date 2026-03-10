# ClawPark — Technical Specification v2

## 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| Language | TypeScript 5.x | 타입 안전성 |
| Framework | React 18 | 컴포넌트 기반 UI |
| Build | Vite 5.x | 빠른 HMR |
| Styling | Tailwind CSS 3.x | 유틸리티 기반 빠른 스타일링 |
| Animation | Framer Motion 11.x | Birth sequence 핵심 |
| Lineage Graph | React Flow 또는 SVG 직접 렌더 | 트리 시각화 |
| State | Zustand 4.x | 경량 글로벌 상태 |
| (선택) AI | Claude API (claude-sonnet-4-20250514) | 자기소개 실시간 생성 |

서버 없음. 정적 SPA. 데이터는 JSON 하드코딩.

---

## 디렉토리 구조

```
clawpark/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── types/
│   │   └── claw.ts                  # 모든 타입 정의
│   │
│   ├── data/
│   │   ├── claws.ts                 # Gen-0 Claw 데이터 (6~8개)
│   │   ├── soulTraits.ts            # 전체 SOUL trait 풀
│   │   ├── skillBadges.ts           # 전체 SKILL badge 풀
│   │   ├── mutations.ts             # mutation 전용 후보 풀
│   │   ├── archetypes.ts            # trait 조합 → archetype 매핑 테이블
│   │   └── introTemplates.ts        # archetype별 자기소개 템플릿
│   │
│   ├── engine/
│   │   ├── breed.ts                 # 메인 오케스트레이터
│   │   ├── inherit.ts               # trait/skill 상속 로직
│   │   ├── mutate.ts                # mutation 로직
│   │   ├── archetype.ts             # archetype 결정 + 자기소개 생성
│   │   ├── predict.ts               # Breed Lab 예측 패널 계산
│   │   └── visual.ts                # 색상/형태/상징 생성
│   │
│   ├── store/
│   │   └── useClawStore.ts          # Zustand store
│   │
│   ├── components/
│   │   ├── Gallery/
│   │   │   ├── Gallery.tsx
│   │   │   └── ClawCard.tsx
│   │   ├── BreedLab/
│   │   │   ├── BreedLab.tsx
│   │   │   ├── ParentSlot.tsx
│   │   │   ├── PredictionPanel.tsx  # 신규: 예측 패널
│   │   │   └── BreedButton.tsx
│   │   ├── Birth/
│   │   │   ├── BirthScene.tsx       # phase 전환 오케스트레이터
│   │   │   ├── MergePhase.tsx
│   │   │   ├── BlendPhase.tsx
│   │   │   ├── BirthPhase.tsx
│   │   │   ├── RevealPhase.tsx      # 강화: archetype + 자기소개
│   │   │   └── TraitTag.tsx
│   │   ├── Lineage/                 # 신규
│   │   │   └── LineageGraph.tsx
│   │   └── shared/
│   │       ├── ClawAvatar.tsx       # trait 기반 시각 형태 렌더러
│   │       └── TraitBadge.tsx
│   │
│   └── utils/
│       ├── random.ts                # 시드 기반 난수
│       ├── color.ts                 # 색상 블렌딩
│       └── demoMode.ts              # 신규: Demo 모드 제어
│
├── public/
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Type Definitions (`src/types/claw.ts`)

```typescript
// ═══════════════════════════════════════
//  기본 단위
// ═══════════════════════════════════════

export interface SoulTrait {
  id: string;                          // "trait_cautious"
  label: string;                       // "신중함"
  description: string;                 // "결정 전 반드시 검증 단계를 거침"
  weight: number;                      // 0~1, 상속 확률
  color: string;                       // hex
  visualSymbol: VisualSymbol;          // 신규: trait의 시각 상징
}

export interface SkillBadge {
  id: string;                          // "skill_code_review"
  label: string;                       // "코드리뷰"
  icon: string;                        // lucide icon name
  dominance: number;                   // 0~1, 우성도
  color: string;                       // hex
}

// trait가 형태로 번역되는 규칙
export interface VisualSymbol {
  shapeModifier: ShapeModifier;
  description: string;                 // 디버깅용
}

export type ShapeModifier =
  | "symmetric"       // 신중함: 대칭적, 안정적
  | "tentacle"        // 호기심: 촉수형, 확장
  | "angular"         // 비판적: 날카로운 각
  | "grid"            // 문서화: 격자, 레이어
  | "fragmented"      // 프로토타이핑: 조립된 파편감
  | "organic"         // 즉흥적: 유기적 곡선
  | "geometric"       // 분석적: 기하학 패턴
  | "spiral"          // 창의적: 소용돌이
  | "crystalline";    // 체계적: 결정 구조

// ═══════════════════════════════════════
//  Claw 개체
// ═══════════════════════════════════════

export interface ClawVisual {
  primaryColor: string;                // hex
  secondaryColor: string;             // hex
  shapeModifiers: ShapeModifier[];    // 상속된 trait들의 상징 합성
  pattern: "solid" | "gradient" | "stripe" | "dot" | "wave";
  glowIntensity: number;              // 0~1, mutation 시 높아짐
}

export interface Claw {
  id: string;                          // uuid
  name: string;                        // "Sage", "Bolt", "Ember"
  archetype: string;                   // "The Patient Analyst" — 신규
  generation: number;                  // Gen-0 = pre-made
  soul: {
    traits: SoulTrait[];               // 최대 3개
  };
  skills: {
    badges: SkillBadge[];              // 최대 3개
  };
  visual: ClawVisual;
  intro: string;                       // 신규: 자기소개 한 문장
  lineage: ClawLineage | null;         // Gen-0이면 null
}

export interface ClawLineage {
  parentA: string;                     // parent claw id
  parentB: string;                     // parent claw id
  inheritanceMap: InheritanceRecord[];
}

// ═══════════════════════════════════════
//  Breeding 관련
// ═══════════════════════════════════════

export type TraitOrigin = "parentA" | "parentB" | "both" | "mutation";

export interface InheritanceRecord {
  type: "soul" | "skill";
  traitId: string;
  origin: TraitOrigin;
  originWeight?: number;
}

export interface BreedRequest {
  parentA: Claw;
  parentB: Claw;
  preferredTraitId?: string;
  seed?: number;
  demoMode?: boolean;                  // 신규
}

export interface BreedResult {
  child: Claw;
  inheritanceMap: InheritanceRecord[];
  mutationOccurred: boolean;
  mutatedTrait?: SoulTrait | SkillBadge;
}

// ═══════════════════════════════════════
//  예측 패널 (신규)
// ═══════════════════════════════════════

export interface TraitPrediction {
  traitId: string;
  label: string;
  probability: number;                 // 0~1
  source: "parentA" | "parentB" | "both";
}

export interface BreedPrediction {
  traitPredictions: TraitPrediction[];
  mutationChance: number;              // 0~1
  predictedArchetype: string;
}

// ═══════════════════════════════════════
//  Animation 상태
// ═══════════════════════════════════════

export type BirthPhase =
  | "idle"
  | "merge"          // 1.5s: trait들이 중앙으로
  | "blend"          // 2.0s: 상속/소실/mutation 시각화
  | "birth"          // 1.0s: 새 형체 등장
  | "reveal_name"    // 0.5s: 이름
  | "reveal_archetype" // 0.8s: archetype 타이핑
  | "reveal_traits"  // 1.2s: trait 카드 순차 등장
  | "reveal_intro"   // 0.5s: 자기소개 페이드인
  | "complete";

export interface AnimationState {
  phase: BirthPhase;
  progress: number;
  highlightedTraits: string[];
  eliminatedTraits: string[];
  mutatingTrait: string | null;
}

// ═══════════════════════════════════════
//  Archetype (신규)
// ═══════════════════════════════════════

export interface ArchetypeEntry {
  traitComboKey: string;               // 정렬된 trait id 조합
  name: string;                        // "The Skeptical Builder"
  introTemplate: string;               // "I {verb} but {contrast}..."
}
```

---

## Zustand Store (`src/store/useClawStore.ts`)

```typescript
import { create } from "zustand";
import type {
  Claw, BreedResult, BreedPrediction, BirthPhase
} from "../types/claw";

interface ClawStore {
  // ── Gallery ──
  claws: Claw[];
  selectedIds: [string, string] | [string] | [];
  selectClaw: (id: string) => void;
  deselectClaw: (id: string) => void;
  clearSelection: () => void;

  // ── Breed Lab ──
  prediction: BreedPrediction | null;          // 신규
  preferredTraitId: string | null;             // 신규
  setPreferredTrait: (traitId: string | null) => void;
  computePrediction: () => void;

  // ── Breed Result ──
  breedResult: BreedResult | null;
  setBreedResult: (result: BreedResult) => void;
  addChildToGallery: () => void;

  // ── Animation ──
  birthPhase: BirthPhase;
  setBirthPhase: (phase: BirthPhase) => void;

  // ── Navigation ──
  screen: "gallery" | "breedLab" | "birth" | "lineage";   // lineage 추가
  setScreen: (screen: ClawStore["screen"]) => void;

  // ── Demo Mode ──
  demoMode: boolean;                           // 신규
  toggleDemoMode: () => void;
}
```

---

## Engine 상세

### `src/engine/breed.ts` — 메인 오케스트레이터

```typescript
export function breed(request: BreedRequest): BreedResult {
  const rng = createRng(request.seed ?? Date.now());

  // 1. SOUL 상속
  const soulResult = inheritSoulTraits(
    request.parentA.soul.traits,
    request.parentB.soul.traits,
    request.preferredTraitId,
    rng
  );

  // 2. SKILL 상속
  const skillResult = inheritSkillBadges(
    request.parentA.skills.badges,
    request.parentB.skills.badges,
    rng
  );

  // 3. Mutation
  const mutationResult = attemptMutation(
    soulResult,
    skillResult,
    rng,
    request.demoMode    // demo 모드면 보장
  );

  // 4. Archetype + 자기소개
  const { archetype, intro } = resolveArchetype(
    mutationResult.finalSoulTraits,
    mutationResult.finalSkillBadges
  );

  // 5. Visual
  const visual = generateVisual(
    request.parentA.visual,
    request.parentB.visual,
    mutationResult.finalSoulTraits,
    mutationResult.occurred
  );

  // 6. 조립
  return {
    child: {
      id: crypto.randomUUID(),
      name: generateName(rng),
      archetype,
      generation: Math.max(
        request.parentA.generation,
        request.parentB.generation
      ) + 1,
      soul: { traits: mutationResult.finalSoulTraits },
      skills: { badges: mutationResult.finalSkillBadges },
      visual,
      intro,
      lineage: {
        parentA: request.parentA.id,
        parentB: request.parentB.id,
        inheritanceMap: [
          ...soulResult.records,
          ...skillResult.records,
          ...(mutationResult.record ? [mutationResult.record] : [])
        ],
      },
    },
    inheritanceMap: [
      ...soulResult.records,
      ...skillResult.records,
      ...(mutationResult.record ? [mutationResult.record] : [])
    ],
    mutationOccurred: mutationResult.occurred,
    mutatedTrait: mutationResult.newTrait,
  };
}
```

### `src/engine/inherit.ts` — 상속 로직

```typescript
export interface SoulInheritanceResult {
  selected: SoulTrait[];
  eliminated: SoulTrait[];
  records: InheritanceRecord[];
}

/**
 * SOUL 상속 알고리즘:
 *
 * 1. 양쪽 traits를 합침 → pool (최대 6개)
 * 2. 중복 감지:
 *    - 같은 id가 양쪽에 → origin: "both", weight *= 1.2 (cap 1.0)
 *    - guaranteed slot에 추가
 * 3. preferredTraitId가 있으면 → weight *= 1.5
 * 4. guaranteed를 먼저 채운 뒤, 남은 슬롯을 weighted random sampling
 * 5. 최종 3개 선택, 나머지는 eliminated
 */
export function inheritSoulTraits(
  traitsA: SoulTrait[],
  traitsB: SoulTrait[],
  preferredTraitId: string | undefined,
  rng: () => number
): SoulInheritanceResult { ... }

/**
 * SKILL 상속 알고리즘:
 *
 * SOUL과 동일 구조, weight 대신 dominance 사용.
 */
export function inheritSkillBadges(
  badgesA: SkillBadge[],
  badgesB: SkillBadge[],
  rng: () => number
): SkillInheritanceResult { ... }
```

### `src/engine/mutate.ts` — Mutation 로직

```typescript
export interface MutationResult {
  occurred: boolean;
  finalSoulTraits: SoulTrait[];
  finalSkillBadges: SkillBadge[];
  newTrait?: SoulTrait | SkillBadge;
  record?: InheritanceRecord;
}

/**
 * Mutation 규칙:
 *
 * 확률 결정:
 *   - 기본: 10%
 *   - 부모 공유 trait ≥ 3: 15%
 *   - 부모 공유 trait = 0: 5%
 *   - demoMode: 100% (최소 1회 보장)
 *
 * 발생 시:
 *   - 50/50으로 soul 또는 skill 중 택 1
 *   - mutation pool에서 부모에게 없는 것 1개 선택
 *   - 상속 결과 중 가장 낮은 weight/dominance 항목을 교체
 *   - glowIntensity 0.8로 설정
 */
export function attemptMutation(
  soulResult: SoulInheritanceResult,
  skillResult: SkillInheritanceResult,
  rng: () => number,
  demoMode?: boolean
): MutationResult { ... }
```

### `src/engine/archetype.ts` — 신규: Archetype 결정

```typescript
/**
 * Archetype 결정 방식:
 *
 * 1. 자식의 최종 soul traits를 id 기준 정렬
 * 2. 정렬된 id 조합으로 lookup key 생성
 * 3. archetypes lookup table에서 매칭
 * 4. 매칭되면 → 해당 archetype name + intro template 사용
 * 5. 매칭 안 되면 → fallback: trait 기반 조합 생성
 *    - 형식: "The [첫번째 trait 형용사형] [두번째 trait 명사형]"
 *
 * 자기소개 생성:
 * - introTemplate에 trait label을 변수 치환
 * - 예: "I {trait1} but {trait2}, and sometimes {mutation_trait}."
 */
export function resolveArchetype(
  soulTraits: SoulTrait[],
  skillBadges: SkillBadge[]
): { archetype: string; intro: string } { ... }
```

### `src/engine/predict.ts` — 신규: 예측 패널 계산

```typescript
/**
 * Breed Lab에서 breed 실행 전에 호출.
 * 실제 breed와 동일한 확률 모델을 사용하되, 결과를 확정하지 않고
 * 확률만 반환한다.
 *
 * preferredTraitId가 바뀔 때마다 재계산 → UI에서 실시간 반영.
 */
export function predictBreed(
  parentA: Claw,
  parentB: Claw,
  preferredTraitId?: string
): BreedPrediction {
  const pool = mergePools(parentA, parentB, preferredTraitId);

  return {
    traitPredictions: pool.map(t => ({
      traitId: t.id,
      label: t.label,
      probability: t.normalizedWeight,
      source: t.source,
    })),
    mutationChance: computeMutationChance(parentA, parentB),
    predictedArchetype: guessArchetype(
      pool.slice(0, 3)  // 확률 상위 3개로 예측
    ),
  };
}
```

### `src/engine/visual.ts` — Visual 생성

```typescript
/**
 * Visual 생성 규칙 (v2 강화):
 *
 * primaryColor:
 *   부모 두 색상의 HSL 보간 (hue는 shortest arc)
 *
 * secondaryColor:
 *   자식 soul traits의 color 평균
 *
 * shapeModifiers:
 *   각 상속된 soul trait의 visualSymbol.shapeModifier를 수집
 *   → ClawAvatar 컴포넌트가 이 modifiers를 합성하여 형태 렌더링
 *   예: ["symmetric", "fragmented"] → 대칭적이되 일부가 파편화된 형태
 *
 * pattern:
 *   skill badge 조합 기반 결정
 *
 * glowIntensity:
 *   mutation 발생 → 0.8
 *   일반 → 0.3
 */
export function generateVisual(
  visualA: ClawVisual,
  visualB: ClawVisual,
  childSoulTraits: SoulTrait[],
  hasMutation: boolean
): ClawVisual { ... }
```

---

## Demo Mode (`src/utils/demoMode.ts`)

```typescript
/**
 * Demo 모드 제어.
 * 활성화: URL ?demo=true 또는 Ctrl+Shift+D
 *
 * Demo 모드에서 달라지는 것:
 * - mutation 100% 보장
 * - seed 고정 (재현 가능한 인상적인 결과)
 * - 자기소개 문장을 사전 작성된 최고 버전으로 교체
 * - 첫 breed 시 추천 부모 조합을 Gallery에서 하이라이트
 */

export function isDemoMode(): boolean {
  return new URLSearchParams(window.location.search).has("demo");
}

export const DEMO_SEED = 42;

export const DEMO_INTRO_OVERRIDES: Record<string, string> = {
  "claw-019": "I inherited caution from Sage, speed from Bolt, and a dangerous taste for unfinished ideas.",
  // ...
};
```

---

## Animation Sequence 상세

### 타임라인

```
idle
  │ [Breed 버튼 클릭 → breed() 즉시 실행, 결과 저장]
  ▼
merge (1.5s)
  │  부모 trait 태그가 양쪽에서 중앙으로 float
  │  각 태그는 고유 색상으로 빛남
  ▼
blend (2.0s)
  │  상속 trait → scale 1.2, glow, 위로 떠오름
  │  소실 trait → scale 0.5, opacity 0, 아래로 가라앉음
  │  mutation → 0.8s 딜레이 후 보라색 번쩍, 화면 shake
  ▼
birth (1.0s)
  │  빛 수렴 → 새 Claw 형체 scale 0→1.2→1.0 (spring)
  │  shapeModifiers가 합성된 고유 형태
  ▼
reveal_name (0.5s)
  │  이름 fade in: "Ember"
  ▼
reveal_archetype (0.8s)
  │  archetype 타이핑 효과: "The Skeptical Builder"
  │  한 글자씩 타자기처럼
  ▼
reveal_traits (1.2s)
  │  trait 카드 순차 등장 (delay: index * 0.4s)
  │  각 카드에 출처 표시:
  │    신중함       ← Sage (Parent A)
  │    프로토타이핑  ← Bolt (Parent B)
  │    가설 점프     ← Mutation ✦
  ▼
reveal_intro (0.5s)
  │  자기소개 문장 이탤릭 fade in
  │  "I build fast but verify twice..."
  ▼
complete
  │  하단 버튼 등장:
  │  [View Lineage] [Breed Again] [Back to Gallery]
```

### Framer Motion 구현 핵심

```typescript
// ── MergePhase ──
// 부모 trait들이 중앙으로 이동
<motion.div
  initial={{ x: fromParentSide, opacity: 0.5 }}
  animate={{ x: 0, y: 0, opacity: 0.8 }}
  transition={{ duration: 1.5, ease: "easeInOut" }}
/>

// ── BlendPhase: 상속 ──
<motion.div
  animate={{ scale: 1.2, opacity: 1, filter: "brightness(1.5)" }}
  transition={{ duration: 0.6 }}
  style={{ boxShadow: `0 0 24px ${trait.color}` }}
/>

// ── BlendPhase: 소실 ──
<motion.div
  animate={{ scale: 0.4, opacity: 0, y: 30 }}
  transition={{ duration: 0.8, ease: "easeIn" }}
/>

// ── BlendPhase: Mutation ──
<motion.div
  initial={{ scale: 0, rotate: -180 }}
  animate={{ scale: [0, 1.6, 1], rotate: [−180, 0] }}
  transition={{ duration: 0.8, delay: 0.8 }}
  className="ring-2 ring-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.8)]"
/>
// 동시에 화면 shake:
<motion.div animate={{ x: [0, -4, 4, -2, 0] }} transition={{ duration: 0.3 }} />

// ── BirthPhase ──
<motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: [0, 1.2, 1], opacity: 1 }}
  transition={{ type: "spring", stiffness: 200, damping: 15 }}
/>

// ── RevealPhase: Archetype 타이핑 ──
// useEffect로 한 글자씩 추가
const [displayed, setDisplayed] = useState("");
useEffect(() => {
  const interval = setInterval(() => {
    setDisplayed(prev => archetype.slice(0, prev.length + 1));
  }, 60);
  return () => clearInterval(interval);
}, [archetype]);

// ── RevealPhase: Trait 카드 순차 등장 ──
{traits.map((trait, i) => (
  <motion.div
    key={trait.id}
    initial={{ x: -20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ delay: i * 0.4, duration: 0.3 }}
  >
    <span>{trait.label}</span>
    <span className="text-sm text-gray-400">← {trait.originLabel}</span>
    {trait.origin === "mutation" && <span>✦</span>}
  </motion.div>
))}

// ── RevealPhase: 자기소개 페이드인 ──
<motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.3, duration: 0.5 }}
  className="italic text-gray-300"
>
  "{child.intro}"
</motion.p>
```

---

## Lineage Graph (`src/components/Lineage/LineageGraph.tsx`)

```typescript
/**
 * 간단한 SVG 기반 트리 시각화.
 *
 * 구조:
 *   - 부모 2개 노드 (상단)
 *   - 연결선 (각 선 위에 상속된 trait 이름)
 *   - 자식 1개 노드 (하단)
 *   - Mutation trait는 자식 노드에 ✦ 표시
 *
 * 멀티 세대:
 *   - Gallery에서 Gen-1 Claw로 다시 breed하면 Gen-2 생성
 *   - lineage graph는 해당 Claw의 전체 조상을 재귀적으로 표시
 *   - MVP에서는 최대 2세대까지만 렌더링
 *
 * 인터랙션:
 *   - 노드 hover → 해당 Claw의 traits 툴팁
 *   - 노드 클릭 → 해당 Claw 상세 보기
 */

interface LineageNodeProps {
  claw: Claw;
  position: { x: number; y: number };
}

interface LineageEdgeProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  inheritedTraits: string[];
}
```

---

## Pre-made Claw 데이터 예시 (`src/data/claws.ts`)

```typescript
export const INITIAL_CLAWS: Claw[] = [
  {
    id: "claw-001",
    name: "Sage",
    archetype: "The Patient Analyst",
    generation: 0,
    soul: {
      traits: [
        {
          id: "cautious", label: "신중함",
          description: "결정 전 반드시 검증",
          weight: 0.8, color: "#3B82F6",
          visualSymbol: { shapeModifier: "symmetric", description: "대칭적 안정감" }
        },
        {
          id: "analytical", label: "분석적",
          description: "데이터 기반 사고",
          weight: 0.7, color: "#6366F1",
          visualSymbol: { shapeModifier: "geometric", description: "기하학적 패턴" }
        },
        {
          id: "patient", label: "인내심",
          description: "장기적 관점 유지",
          weight: 0.5, color: "#8B5CF6",
          visualSymbol: { shapeModifier: "crystalline", description: "결정 구조" }
        },
      ],
    },
    skills: {
      badges: [
        { id: "code_review", label: "코드리뷰", icon: "Search", dominance: 0.9, color: "#10B981" },
        { id: "testing", label: "테스팅", icon: "Shield", dominance: 0.7, color: "#14B8A6" },
        { id: "documentation", label: "문서화", icon: "FileText", dominance: 0.5, color: "#06B6D4" },
      ],
    },
    visual: {
      primaryColor: "#3B82F6",
      secondaryColor: "#6366F1",
      shapeModifiers: ["symmetric", "geometric", "crystalline"],
      pattern: "gradient",
      glowIntensity: 0.3,
    },
    intro: "I never skip the proof. Every conclusion earns its place.",
    lineage: null,
  },

  {
    id: "claw-002",
    name: "Bolt",
    archetype: "The Reckless Prototyper",
    generation: 0,
    soul: {
      traits: [
        {
          id: "spontaneous", label: "즉흥적",
          description: "빠른 판단, 즉시 실행",
          weight: 0.9, color: "#F59E0B",
          visualSymbol: { shapeModifier: "organic", description: "유기적 비대칭" }
        },
        {
          id: "curious", label: "호기심",
          description: "새로운 것을 먼저 시도",
          weight: 0.7, color: "#EF4444",
          visualSymbol: { shapeModifier: "tentacle", description: "촉수형 확장" }
        },
        {
          id: "optimistic", label: "낙관적",
          description: "실패를 두려워하지 않음",
          weight: 0.5, color: "#F97316",
          visualSymbol: { shapeModifier: "spiral", description: "소용돌이 에너지" }
        },
      ],
    },
    skills: {
      badges: [
        { id: "prototyping", label: "프로토타이핑", icon: "Zap", dominance: 0.9, color: "#FBBF24" },
        { id: "ideation", label: "아이디어", icon: "Lightbulb", dominance: 0.7, color: "#FB923C" },
        { id: "speed_coding", label: "속도코딩", icon: "Timer", dominance: 0.6, color: "#F87171" },
      ],
    },
    visual: {
      primaryColor: "#F59E0B",
      secondaryColor: "#EF4444",
      shapeModifiers: ["organic", "tentacle", "spiral"],
      pattern: "wave",
      glowIntensity: 0.3,
    },
    intro: "Ship first, ask questions while it's already running.",
    lineage: null,
  },

  // ... 4~6개 더 (다양한 조합)
];
```

---

## Archetype Lookup 예시 (`src/data/archetypes.ts`)

```typescript
export const ARCHETYPE_MAP: Record<string, { name: string; introTemplate: string }> = {
  // key = 정렬된 soul trait id들의 조합
  "analytical|cautious|patient": {
    name: "The Patient Analyst",
    introTemplate: "I never skip the proof. Every conclusion earns its place.",
  },
  "cautious|curious|spontaneous": {
    name: "The Skeptical Explorer",
    introTemplate: "I leap — but I always check where I'm landing.",
  },
  "cautious|optimistic|spontaneous": {
    name: "The Skeptical Builder",
    introTemplate: "I build fast but verify twice — and sometimes, I leap before the data says I should.",
  },
  // ... 30~40개
};

// fallback: 매칭 안 되면 동적 생성
export function fallbackArchetype(traits: SoulTrait[]): string {
  const adj = TRAIT_ADJECTIVES[traits[0].id] ?? "Unknown";
  const noun = TRAIT_NOUNS[traits[1].id] ?? "Agent";
  return `The ${adj} ${noun}`;
}
```

---

## 팀별 작업 범위

### UI / Visualization 팀

| 파일 | 우선순위 | 설명 |
|------|----------|------|
| `BirthScene.tsx` | ★★★ | phase 전환 오케스트레이터 |
| `MergePhase.tsx` | ★★★ | trait float 애니메이션 |
| `BlendPhase.tsx` | ★★★ | 상속/소실/mutation 시각화 |
| `BirthPhase.tsx` | ★★★ | 새 형체 등장 spring 애니메이션 |
| `RevealPhase.tsx` | ★★★ | archetype 타이핑 + trait 카드 + 자기소개 |
| `ClawAvatar.tsx` | ★★☆ | shapeModifier 합성 → SVG/Canvas 렌더 |
| `PredictionPanel.tsx` | ★★☆ | 확률 바 + mutation chance + predicted archetype |
| `LineageGraph.tsx` | ★★☆ | SVG 트리 시각화 |
| `ClawCard.tsx` | ★☆☆ | 기본 카드 레이아웃 |
| `Gallery.tsx` | ★☆☆ | 그리드 + 선택 인터랙션 |

### Feature / Logic 팀

| 파일 | 우선순위 | 설명 |
|------|----------|------|
| `breed.ts` | ★★★ | 메인 오케스트레이터 |
| `inherit.ts` | ★★★ | weighted random sampling |
| `mutate.ts` | ★★★ | mutation 확률 + demo mode 보장 |
| `archetype.ts` | ★★★ | archetype 결정 + 자기소개 생성 |
| `predict.ts` | ★★☆ | 예측 패널 계산 |
| `visual.ts` | ★★☆ | HSL 보간 + shapeModifier 합성 |
| `useClawStore.ts` | ★★☆ | 상태 관리 |
| `demoMode.ts` | ★☆☆ | demo 모드 제어 |
| `claws.ts` + `archetypes.ts` | ★☆☆ | 데이터 작성 |
| `random.ts` + `color.ts` | ★☆☆ | 유틸리티 |

---

## 마일스톤

| 단계 | 목표 | 완료 기준 |
|------|------|-----------|
| M1 | 타입 + 데이터 | `types/claw.ts` 확정, `data/*.ts` 전부 작성 |
| M2 | Breeding 엔진 | `breed()` → `BreedResult` 정상 반환. mutation, archetype 포함 |
| M3 | Gallery + Breed Lab | 카드 선택 → 예측 패널 표시 → breed 실행 (애니메이션 없이 결과 확인) |
| M4 | Birth Animation | merge → blend → birth → reveal 전체 시퀀스 |
| M5 | Lineage + Demo Mode | lineage graph, demo 모드 활성화 |
| M6 | 통합 + 폴리싱 | 전체 플로우 연결, 타이밍 조정, 발표 리허설 |

**병렬 분기점: M2 완료 후.**
Logic 팀은 M2 → predict.ts → data 보강.
UI 팀은 M3 → M4 → M5 순서로 시각화 집중.
