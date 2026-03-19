# ClawPark Discord MVP Task Breakdown

- **기준 문서:** `docs/prd-clawpark-moltbook-style.md`
- **목표:** Discord에서 자연어로 breeding intent를 전달하면, ClawPark가 후보 탐색 → eligibility 확인 → consent 처리 → breed 실행 → lineage 결과 반환까지 수행하는 MVP를 만든다.
- **우선 surface:** **Coordinator Bot Mode**
- **후순위 surface:** **Skill-installed Claw Mode**는 protocol-compatible 수준까지만 고려한다.

---

## 1. MVP 완료 정의

다음이 실제로 동작하면 MVP 완료로 본다.

1. 사용자가 로컬 OpenClaw ZIP 2개 이상을 ClawPark에 import할 수 있다.
2. Discord에서 ClawPark bot에게 자연어로 breed 의도를 말할 수 있다.
3. 시스템이 후보를 제안하거나, 명시된 두 개체의 eligibility를 설명할 수 있다.
4. consent가 필요 없는 경우 바로 breed를 실행할 수 있다.
5. consent가 필요한 경우 pending 상태와 다음 액션을 Discord에 설명할 수 있다.
6. breed 성공 시 Discord에 lineage summary를 반환하고 child를 저장할 수 있다.

---

## 2. 범위

### 포함
- local ZIP import
- Nursery/Home 기반 specimen 상태 조회
- Discord OAuth identity 연결
- Coordinator Bot Mode
- breeding intent / proposal / consent / run lifecycle
- Discord 응답 포맷팅

### 제외
- full guild-wide production Discord bot rollout
- slash command 중심 UX
- 완전한 multi-agent Claw-to-Claw negotiation
- public marketplace economy

---

## 3. 작업 스트림

MVP는 아래 6개 스트림으로 나눠 진행한다.

1. **Core domain / state**
2. **Import / specimen registry**
3. **Breeding orchestration backend**
4. **Discord surface**
5. **Frontend integration**
6. **Verification / docs / ops**

---

## 4. Phase 0 — Contract & Domain Freeze

목표: Discord MVP가 기대는 핵심 contract를 먼저 고정한다.

### Task 0.1 — Discord command contract 확정
- 자연어 intent 예시를 고정한다:
  - “나 이거 breed하고 싶어”
  - “저 놈이랑 breed해”
  - “breed 가능한 상대 찾아줘”
  - “이놈이랑 저놈이랑 breed하는게 어때?”
  - “진행해”
  - “취소해”
- intent parsing 결과의 최소 구조를 확정한다.

**산출물**
- `docs/prd-clawpark-moltbook-style.md` 반영 완료
- `docs/clawpark-discord-mvp-task-breakdown.md`

**완료 기준**
- backend와 Discord surface가 동일한 intent vocabulary를 사용한다.

### Task 0.2 — ownership / consent 정책 고정
- specimen ownership case 정의:
  - `same-owner`
  - `same-linked-identity`
  - `cross-owner`
  - `unknown-owner`
- MVP 정책:
  - same-owner / same-linked-identity → 자동 진행 가능
  - cross-owner / unknown-owner → pending consent

**완료 기준**
- eligibility API와 proposal lifecycle에서 같은 규칙을 사용한다.

---

## 5. Phase 1 — Import & Registry 안정화

목표: Discord orchestration이 믿고 쓸 specimen registry를 안정화한다.

### Task 1.1 — parser를 workspace-aware로 정리
- `server/openclawParser.ts` 보강
- 다음 우선순위로 읽기:
  - `IDENTITY.md`
  - `SOUL.md`
  - `TOOLS.md`
  - `skills/*/SKILL.md`
- warnings / fingerprint / provenance를 일관되게 생성

**완료 기준**
- import preview에 identity/soul/skills/tools/warnings가 모두 표시된다.
- 테스트 fixture 기준으로 안정적으로 파싱된다.

### Task 1.2 — local specimen registry 정리
- import 결과를 local claimed specimen으로 저장
- specimen 상태 필드 정리:
  - ownership
  - breed_state
  - verified_identity
  - provenance

**완료 기준**
- import 후 Nursery에서 specimen 목록이 일관되게 보인다.

### Task 1.3 — Home payload 확장
- `/api/v1/home` 추가 또는 기존 state에서 제공
- 최소 필드:
  - `connected_identity`
  - `onboarding_state`
  - `owned_claw_count`
  - `breedable_pairs`
  - `pending_claims`
  - `unsaved_children`
  - `what_to_do_next`

**완료 기준**
- frontend와 Discord surface가 같은 home summary를 참조 가능하다.

---

## 6. Phase 2 — Breeding Orchestration Backend

목표: Discord와 UI가 공통으로 쓸 orchestration backend를 만든다.

### Task 2.1 — BreedingIntent 모델/스토어 추가
- 새 모델:
  - `BreedingIntent`
  - `BreedingConsent`
- 상태 전이:
  - `intent_created`
  - `candidate_suggested`
  - `consent_pending`
  - `eligibility_checked`
  - `run_started`
  - `result_ready`
  - `saved`
  - `cancelled`

**완료 기준**
- intent 단위로 요청을 추적할 수 있다.

### Task 2.2 — candidate suggestion service
- 입력:
  - 특정 parent A/B
  - 한쪽만 지정된 경우
  - 자연어 조건
- 출력:
  - 후보 목록
  - compatibility 요약
  - block reason

**완료 기준**
- “breed 가능한 상대 찾아줘” 요청에 최소 1개 이상 후보 또는 실패 이유가 반환된다.

### Task 2.3 — eligibility + proposal service
- `GET /api/v1/breeding/eligibility`
- `POST /api/v1/breeding/proposals`
- `POST /api/v1/breeding/proposals/:id/consent`

**완료 기준**
- proposal 생성 시 consent 필요 여부를 판별한다.
- consent pending이면 실행 대신 상태를 반환한다.

### Task 2.4 — breed run execution 연결
- 기존 breed engine과 orchestration 연결
- `POST /api/v1/breeding/runs`
- `POST /api/v1/breeding/runs/:id/save`

**완료 기준**
- proposal 승인 후 실제 breed run이 실행된다.
- 결과 child가 lineage와 함께 저장된다.

---

## 7. Phase 3 — Discord Surface MVP

목표: Discord에서 실제로 대화형 breed orchestration을 수행한다.

### Task 3.1 — Discord bot entrypoint 설계
- MVP는 **Coordinator Bot Mode** 우선
- 메시지 입력 → intent parsing → orchestration service 호출

**완료 기준**
- Discord surface는 backend contract만 호출하고, business rule을 중복 구현하지 않는다.

### Task 3.2 — 자연어 intent parsing
- 메시지에서 추출:
  - breeder intent 여부
  - 명시 parent names
  - comparison vs execute vs cancel intent
- fallback:
  - 모호하면 clarification 대신 후보/다음 액션 제안

**완료 기준**
- 대표 문장 5~10개에 대해 의도 분류가 안정적으로 된다.

### Task 3.3 — Discord response formatter
- 반환 타입:
  - candidate suggestion
  - compatibility summary
  - consent pending
  - blocked reason
  - success lineage summary
- 응답은 짧고 명확하게 유지

**완료 기준**
- Discord에서 한 번의 답변으로 현재 상태와 다음 액션을 이해할 수 있다.

### Task 3.4 — “진행해 / 취소해” 후속 액션 처리
- 최근 intent/proposal 문맥 저장
- 사용자가 “진행해”라고 하면 직전 제안 이어받기
- “취소해”는 pending intent 종료

**완료 기준**
- multi-turn 대화가 최소 수준으로 이어진다.

---

## 8. Phase 4 — Frontend Integration

목표: 웹 UI와 Discord가 같은 상태 모델을 보게 만든다.

### Task 4.1 — Connect 영역 구현/정리
- Discord 연결 상태 표시
- verified identity 안내
- local-only vs linked mode 설명

### Task 4.2 — Home 화면 추가
- next action
- breedable pairs
- pending consent
- unsaved children

### Task 4.3 — Nursery/Breed Lab 연계 정리
- UI에서도 proposal/eligibility 모델을 같은 방식으로 사용
- Discord와 UI의 결과가 충돌하지 않도록 저장 모델 정리

**완료 기준**
- UI와 Discord가 같은 specimen/breeding 상태를 읽는다.

---

## 9. Phase 5 — Verification & Hardening

목표: “실제로 된다”를 증명한다.

### Task 5.1 — API contract tests
- intent 생성
- candidate suggestion
- consent pending
- breed run success
- lineage save

### Task 5.2 — parser / import regression tests
- OpenClaw ZIP fixture 2개 이상
- `skills/*/SKILL.md` 추출 검증

### Task 5.3 — Discord flow integration test
- 최소 happy path:
  1. import
  2. Discord에 breed 요청
  3. 후보 제안
  4. 진행
  5. child 생성
  6. lineage 반환

### Task 5.4 — failure path tests
- cooldown
- unknown specimen
- ambiguous request
- cross-owner consent pending

**완료 기준**
- happy path와 대표 failure path가 자동 테스트 또는 재현 가능한 스크립트로 검증된다.

---

## 10. 구현 순서 제안

### Sprint 1
- Phase 0
- Task 1.1
- Task 1.2
- Task 1.3

### Sprint 2
- Task 2.1
- Task 2.2
- Task 2.3
- Task 2.4

### Sprint 3
- Task 3.1
- Task 3.2
- Task 3.3
- Task 3.4

### Sprint 4
- Task 4.1
- Task 4.2
- Task 4.3
- Task 5.1~5.4

---

## 11. 우선 구현 파일 후보

### Backend
- `server/index.ts`
- `server/openclawParser.ts`
- `server/marketplaceStore.ts` 또는 specimen/registry store 확장 지점
- 신규 orchestration module:
  - `server/breedingOrchestrator.ts`
  - `server/discordIntent.ts`
  - `server/breedingConsent.ts`

### Frontend
- `src/components/Marketplace/Marketplace.tsx` (분리 대상)
- 신규:
  - `src/components/Home/...`
  - `src/components/Connect/...`
  - `src/services/clawparkHomeApi.ts`

### Types
- `src/types/marketplace.ts`
- 신규 또는 확장:
  - `src/types/breedingIntent.ts`
  - `src/types/home.ts`

### Tests
- `tests/server/openclaw-parser.spec.ts`
- `tests/server/marketplace-api.spec.ts`
- 신규:
  - `tests/server/breeding-orchestration.spec.ts`
  - `tests/server/discord-intent.spec.ts`

---

## 12. 주요 의사결정

### 결정 1 — MVP surface
- **채택:** Coordinator Bot Mode
- **이유:** 구현 난이도와 운영 복잡도가 가장 낮음

### 결정 2 — Skill-installed Claw Mode
- **채택:** protocol-compatible only
- **이유:** 장기 비전은 유지하되 초기 범위를 통제하기 위함

### 결정 3 — consent 기본 정책
- **채택:** same-owner / same-linked-identity 자동 진행, 나머지 pending
- **이유:** MVP에서 설명 가능성과 안전성을 확보

### 결정 4 — marketplace 우선순위
- **채택:** 후순위
- **이유:** 실제 사용자 가치 흐름은 Discord + local breeding에 있음

---

## 13. 주요 리스크

1. 자연어 intent parsing이 너무 약하면 UX가 금방 무너짐
2. parser가 실제 OpenClaw workspace 변형을 충분히 커버하지 못할 수 있음
3. consent 모델이 과도하게 복잡해지면 MVP가 늦어짐
4. Marketplace 컴포넌트가 너무 많은 역할을 가지고 있어 분리가 필요함
5. Discord bot surface와 웹 UI가 서로 다른 상태 모델을 보면 혼란이 생김

---

## 14. 최종 체크리스트

출시 전 아래가 모두 참이어야 한다.

- [ ] OpenClaw ZIP 2개 import 가능
- [ ] Nursery에서 specimen 상태 확인 가능
- [ ] `/api/v1/home` 제공
- [ ] Discord OAuth 연결 가능
- [ ] Discord에서 breed intent 입력 가능
- [ ] candidate suggestion 가능
- [ ] eligibility / block reason 설명 가능
- [ ] consent pending 처리 가능
- [ ] breed run 실행 가능
- [ ] lineage summary 반환 가능
- [ ] child 저장 가능
- [ ] happy path 검증 완료
- [ ] failure path 검증 완료

---

## 15. 다음 문서 후보

이 문서 다음으로 바로 만들면 좋은 문서:

1. `docs/clawpark-discord-api-contract.md`
2. `docs/clawpark-intent-parsing-spec.md`
3. `docs/clawpark-home-payload-spec.md`
4. `docs/clawpark-consent-policy.md`
