# ClawPark — Product Spec v2

## 한 줄 요약
**AI 에이전트를 교배해 새로운 에이전트를 탄생시키는 인터랙티브 진화 실험.**

발표용: *CryptoKitties for AI agents — breed personality and skills into a new lifeform.*

---

## Demo Flow (4 screens)

### Screen 1: Claw Gallery

6~8마리의 Gen-0 Claw가 그리드로 나열된다.

각 카드에 표시되는 정보:
- **이름 + Archetype** (예: `Claw-07 "Sage" — The Patient Analyst`)
- **SOUL traits** — 성격 태그 2~3개, 각각 고유 시각 상징 포함
- **SKILL badges** — 능력 아이콘 2~3개
- **시각적 아이덴티티** — trait 조합에서 파생된 형태. 단순 색이 아니라 성격이 형태로 번역된 것.

시각 상징 규칙:
- `신중함` → 대칭적, 안정적 형태
- `호기심` → 촉수형 디테일, 확장하는 느낌
- `비판적` → 날카로운 각, 결정 구조
- `문서화` → 격자, 문양, 레이어 느낌
- `프로토타이핑` → 조립된 듯한 파편감
- `즉흥적` → 유기적 곡선, 비대칭
- `분석적` → 기하학적 패턴, 눈금 느낌

유저가 2마리를 선택하면 하단에 "Enter Breed Lab →" 버튼 활성화.

---

### Screen 2: Breed Lab — 운명 확정의 순간

선택된 두 부모 Claw가 좌우로 배치된다.
각각의 SOUL traits, SKILL badges가 명시적으로 나열된다.

**핵심 추가: 예측 패널 (Prediction Panel)**

Breed 버튼 위에 실시간 예측 정보를 보여준다:

```
┌─────────────────────────────────────┐
│  Expected Inheritance               │
│  ● 신중함  ████████░░  82%          │
│  ● 프로토타이핑  ██████░░░░  61%    │
│  ● 문서화  █████░░░░░  48%          │
│                                     │
│  Mutation Chance: 12%               │
│  Predicted Archetype: Builder-Scholar│
└─────────────────────────────────────┘
```

이 패널의 목적은 "정보 확인"이 아니라 **감정 고조**다.
유저가 "이번엔 뭐가 나올까"를 상상하게 만든다.
버튼은 그냥 실행 버튼이 아니라 **운명 확정 버튼**이다.

**(선택) 유저가 우선시할 trait를 1개 탭해서 가중치를 줄 수 있음.**
탭하면 예측 패널의 확률이 실시간으로 변한다.

Breed 버튼 텍스트: **"Initiate Breeding"**
버튼 누르는 순간 → Screen 3으로 전환.

---

### Screen 3: Birth Sequence — 데모의 심장

> **모든 시각 리소스를 여기에 집중한다. 이 화면이 수상 여부를 결정한다.**

버튼을 누르는 즉시 `breed()` 엔진이 결과를 계산한다.
이후 애니메이션은 이미 결정된 결과를 **연출**하는 것이다.

#### Phase 1: Merge (1.5s)
두 부모의 trait 태그들이 화면 양쪽에서 중앙으로 천천히 흘러들어온다.
각 태그는 자기 고유 색상을 가지고 있고, 중앙에 가까워질수록 빛이 강해진다.

#### Phase 2: Blend (2.0s)
trait들이 중앙에서 뒤섞인다.
- **상속되는 trait** → 빛나면서 위로 떠오른다
- **소실되는 trait** → 서서히 투명해지며 사라진다
- **Mutation 발생 시** → 화면에 없던 새 태그가 번쩍이며 나타난다. 보라색/전기 이펙트. 화면 전체가 잠깐 흔들린다.

#### Phase 3: Birth (1.0s)
빛이 수렴하면서 새 Claw의 형체가 등장한다.
형태는 상속된 trait들의 시각 상징이 합성된 결과다.
scale 0 → 1.2 → 1.0으로 탄력 있게 등장.

#### Phase 4: Reveal — 살아있는 에이전트의 등장 (3.0s)

이 Phase가 v1에서 가장 크게 강화된 부분이다.
단순 카드 생성이 아니라, **새 존재가 자기 자신을 소개하는 순간**으로 연출한다.

Reveal 순서:

**① 이름 등장** (0.5s)
```
Claw-19 "Ember"
```

**② Archetype 타이핑** (0.8s)
이름 아래에 타자기처럼 한 글자씩 찍힘:
```
The Skeptical Builder
```

**③ Trait 출처 카드 순차 등장** (1.2s)
하나씩 아래로 펼쳐진다. 각 카드에 출처가 명시된다:
```
신중함     ← Sage (Parent A)
프로토타이핑  ← Bolt (Parent B)
가설 점프    ← Mutation ✦
```

**④ 자기소개 한 문장** (0.5s)
trait 카드 아래에 이탤릭으로 페이드인:
```
"I build fast but verify twice — and sometimes,
I leap before the data says I should."
```

이 한 문장이 결정적이다.
이것이 결과물을 "카드"에서 **"캐릭터"**로 격상시킨다.
심사위원 머릿속에서 이 순간
"breeding toy" → **"agent design machine"**으로 전환된다.

**자기소개 생성 방식:**
- 기본: trait 조합별 pre-written 템플릿
- (선택) Claude API 호출로 실시간 생성

---

### Screen 4: Lineage View (새로 추가)

Birth 완료 후 하단에 3개 버튼:

```
[ View Lineage ]  [ Breed Again ]  [ Back to Gallery ]
```

**View Lineage** 클릭 시:
간단한 트리 그래프가 표시된다.

```
    Sage          Bolt
  (Analyst)    (Sprinter)
      \           /
       \         /
        Ember
   (Skeptical Builder)
```

- 부모 노드에서 자식 노드로 이어지는 선
- 각 선 위에 상속된 trait 이름이 표시
- Mutation trait는 자식 노드에서 별도 표시 (✦)

이 화면의 목적:
"아, 이건 한 번 섞는 장난감이 아니라 **종의 계보를 만드는 시스템**이구나."

3세대 이상 breeding이 MVP 범위 밖이더라도,
lineage view가 있으면 **가능성을 암시**할 수 있다.

**Breed Again** 클릭 시:
새로 태어난 Claw가 Gallery에 추가된 상태로 Screen 1로 돌아간다.
이제 이 Claw도 부모 후보가 된다.

---

## Demo Mode (발표용)

해커톤 시연에서 랜덤은 적이다.
Demo Mode를 별도로 둔다.

| 항목 | 일반 모드 | Demo 모드 |
|------|-----------|-----------|
| Mutation 확률 | 5~15% | **최소 1회 보장** |
| 첫 breed 결과 | 랜덤 | 미리 정한 인상적인 조합 |
| 자기소개 문장 | 템플릿 or API | **사전 작성된 최고 문장** |
| 시드 | 랜덤 | 고정 (재현 가능) |

Demo Mode 활성화: URL에 `?demo=true` 또는 숨겨진 키보드 단축키.

---

## 데이터 모델 (최소)

```
Claw {
  id: string
  name: string
  archetype: string            // "The Patient Analyst" — 신규
  generation: number
  soul: SoulTrait[3]
  skills: SkillBadge[3]
  visual: ClawVisual
  intro: string                // 자기소개 한 문장 — 신규
  lineage: {
    parentA: ClawId
    parentB: ClawId
    inheritanceMap: InheritanceRecord[]
  } | null
}

InheritanceRecord {
  type: "soul" | "skill"
  traitId: string
  origin: "parentA" | "parentB" | "both" | "mutation"
}
```

---

## Breeding 규칙 (MVP)

### SOUL 상속
- 양쪽 부모의 traits 풀(최대 6개)에서 3개를 확률적으로 선택
- 각 trait의 weight가 높을수록 선택 확률 높음
- 같은 trait이 양쪽에 있으면 → 거의 확정 상속 + weight 증가
- 유저가 선택한 preferred trait → weight 1.5배

### SKILL 상속
- 양쪽 부모의 skills 풀(최대 6개)에서 3개를 확률적으로 선택
- dominance가 높은 skill이 우선
- 같은 skill이 양쪽에 있으면 → 확정 상속

### Mutation
- 기본 확률: 10%
- 부모가 같은 trait 3개 이상 공유 → 15%
- 공유 0개 → 5%
- 발생 시: 가장 낮은 weight 항목을 mutation pool에서 교체
- Demo 모드: 최소 1회 보장

### Archetype 생성
- trait + skill 조합에서 결정론적으로 매핑
- 형식: "The [형용사] [명사]"
- 예: `신중함 + 프로토타이핑 + 가설점프` → "The Skeptical Builder"
- 조합별 lookup table (30~40개 사전 정의)

### Visual 생성
- primaryColor: 부모 색상 HSL 보간
- shape: 상속된 soul traits의 상징 형태 합성
- pattern: 상속된 skill badges 기반
- glowIntensity: mutation 시 0.8, 평소 0.3

---

## 스코프 경계선

### MVP (해커톤 데모에 포함)
- [x] Pre-made Claw 6~8마리
- [x] 2마리 선택 → Breed Lab
- [x] 예측 패널 (상속 확률 + mutation chance + predicted archetype)
- [x] Breeding animation (merge → blend → birth → reveal)
- [x] Reveal에 archetype + 자기소개 한 문장 포함
- [x] Trait 출처 표시 (Parent A / B / Mutation ✦)
- [x] Lineage view (부모-자식 트리)
- [x] Gallery에 새 Claw 추가 → 재breeding 가능
- [x] Demo 모드

### NOT in MVP
- [ ] 실제 SOUL.md / SKILL.md 파일 파싱
- [ ] 마켓플레이스 거래
- [ ] 멀티 유저
- [ ] Claw 성능 평가 (fitness)
- [ ] 온체인 기록
- [ ] Claude API 실시간 자기소개 생성 (있으면 좋지만 없어도 됨)

---

## 수상을 위한 체크리스트

1. **Breed 전 긴장감** — 예측 패널로 기대감을 만든다
2. **Breed 순간의 시각적 임팩트** — 심사위원이 "오" 하는 장면
3. **설명 가능한 결과** — 왜 이 trait가 나왔는지 즉시 보인다
4. **Archetype + 자기소개** — 카드가 아니라 캐릭터가 태어난다
5. **Mutation의 쇼 타이밍** — Demo 모드로 반드시 터뜨린다
6. **Lineage** — 일회성 장난감이 아니라 시스템임을 암시한다
7. **한 문장 피치** — "CryptoKitties for AI agents"

---

## 발표 시나리오 (90초)

1. "각 Claw는 성격과 능력을 가진 AI 에이전트입니다." (Gallery 보여줌)
2. "두 개체를 골라볼게요. Sage는 신중한 분석가, Bolt는 빠른 빌더입니다."
3. "예측을 보면 — 신중함 82%, 프로토타이핑 61%, mutation 확률 12%."
4. "Breed를 누르면…" (버튼 클릭)
5. (애니메이션 — 관객 집중)
6. "Ember가 태어났습니다. The Skeptical Builder."
7. "신중함은 Sage에게서, 프로토타이핑은 Bolt에게서, 그리고 — mutation으로 '가설 점프'가 생겼습니다."
8. "Ember는 이렇게 말합니다: 'I build fast but verify twice.'"
9. "이건 단순 조합이 아닙니다. 새로운 archetype이 진화한 겁니다."
10. (Lineage view 보여줌) "그리고 이 계보는 계속 이어집니다."
