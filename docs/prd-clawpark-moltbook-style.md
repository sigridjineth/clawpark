# PRD — ClawPark

## Moltbook-style Local OpenClaw Hatchery

- **문서 버전:** v0.1
- **작성일:** 2026-03-19
- **상태:** Draft
- **작성 목적:** ClawPark를 Marketplace-first demo에서, **agent-native / import-first / home-guided breeding system**으로 재정의

---

## 1. 제품 개요

### 1.1 제품 한 줄 정의
**ClawPark는 로컬 OpenClaw 개체를 불러와 소유/해석하고, 두 개체를 조합해 child lineage를 생성·보관·공유할 수 있는 agent-native breeding system이다.**

### 1.2 핵심 방향
ClawPark는 단순한 UI 앱이 아니라, Moltbook처럼:

- 제품 스스로를 설명하는 **skill contract**를 가지고
- 에이전트가 매번 “지금 무엇을 해야 하는지” 알 수 있는 **Home / Heartbeat**가 있으며
- 공개 marketplace보다 먼저 **import → claim → breed → lineage**가 중심이 되는 구조를 따른다.
- 사용자는 필요 시 **Discord 계정으로 ClawPark에 연결(onboard)** 할 수 있고, 연결된 정체성은 claim/provenance/publish에 활용된다.
- Discord에서는 두 가지 surface를 통해 ClawPark에 접근할 수 있다:
  - **ClawPark Coordinator Bot**
  - **`clawpark skill`이 설치된 개별 Claw**

---

## 2. 문제 정의

현재 ClawPark는 다음 문제가 있다:

1. **가장 중요한 실제 가치 흐름이 흐릿하다**
   - 사용자가 진짜 원하는 것은
   - “로컬에서 OpenClaw 2개를 올리고”
   - “실제로 breed가 되며”
   - “child lineage가 남는 것”이다.

2. **Marketplace가 핵심 흐름보다 앞에 와 있다**
   - 현재 구조는 publish / browse / claim registry 흐름이 상대적으로 전면에 있다.
   - 하지만 실제 사용 맥락은 **개인 로컬 assistant/workspace import**가 먼저다.

3. **에이전트 친화적 제품 계약이 없다**
   - Moltbook처럼 `skill.md`, `heartbeat.md`, `rules.md` 등을 통해
   - 제품 사용법 자체를 agent-readable contract로 제공하지 않는다.

4. **상태 요약의 단일 진입점이 없다**
   - 지금 당장 import해야 하는지, breed 가능한지, claim이 필요한지, lineage review가 필요한지
   - 한 번에 보여주는 `/home` 개념이 없다.

5. **Discord 연결의 역할이 제품적으로 정리되어 있지 않다**
   - 현재 코드에는 Discord OAuth가 있으나
   - 이것이 “publish 인증용인지”, “온보딩/정체성 연결인지”, “필수인지 선택인지”가 제품 레벨에서 명확하지 않다.

6. **Discord 대화형 breed orchestration 모델이 없다**
   - 사용자는 Discord에서 자연어로 breed를 지시하고 싶어 하지만
   - 현재 문서와 구조에는 command model, consent model, orchestration lifecycle이 정의되어 있지 않다.

---

## 3. 비전

### 3.1 제품 비전
ClawPark는 **OpenClaw 개체의 사육장(hatchery)** 이다.  
사용자는 로컬 OpenClaw 개체를 가져와:

- 정체성/기질/기능을 읽고
- 소유 상태를 확인하고
- 두 개체의 호환성을 보고
- child를 생성하고
- lineage를 보관하고
- 필요시 나중에 exchange/marketplace로 공개할 수 있어야 한다.

### 3.2 설계 원칙
1. **Import-first**
2. **Home-first**
3. **Claim before publish**
4. **Local/private by default**
5. **Marketplace is optional**
6. **Agent-readable product contract**
7. **Heartbeat-driven participation**
8. **Discord-linked identity, local-first behavior**
9. **Conversation-driven breeding orchestration**

---

## 4. 목표 / 비목표

### 4.1 목표
MVP에서 달성해야 할 핵심 목표:

1. 사용자가 **로컬 OpenClaw ZIP 2개를 직접 import**할 수 있다.
2. import된 두 개체를 **Gallery/Nursery**에서 볼 수 있다.
3. 두 개체가 **Breed Lab**에서 실제로 breed 가능하다.
4. 결과 child가 **lineage 포함 상태로 저장**된다.
5. 에이전트/도구가 ClawPark를 이해할 수 있도록:
   - `skill.md`
   - `heartbeat.md`
   - `breeding.md`
   - `rules.md`
   - `skill.json`
   를 제공한다.
6. `/api/v1/home` 또는 동등한 상태 요약 API를 제공한다.
7. 사용자는 원할 경우 **Discord 계정을 연결해 verified identity**를 획득할 수 있다.
8. Discord를 연결하지 않아도 **local import/breed 핵심 흐름은 동작**해야 한다.
9. 사용자는 Discord에서 자연어로 breed intent를 전달할 수 있어야 한다.
10. 시스템은 두 가지 Discord interaction mode를 지원할 수 있어야 한다:
   - dedicated ClawPark bot
   - skill-installed Claw

### 4.2 비목표
MVP에서 하지 않는 것:

- 완전한 상업 marketplace
- 결제/소유권 거래 시스템
- 진짜 OpenClaw runtime 실행
- 공개 registry를 핵심 흐름으로 밀어 올리는 것
- 멀티유저 social network화

---

## 5. 사용자 및 핵심 시나리오

### 5.1 주요 사용자

#### Primary
- **로컬 OpenClaw 사용자**
  - 자신의 assistant/workspace를 ZIP으로 가지고 있음
  - 두 개체를 가져와 실제 breed를 실험하고 싶음

#### Secondary
- **agent-native automation 사용자**
  - CLI/agent가 문서를 읽고 import/breed/save를 자동화하고 싶음

#### Tertiary
- **Discord-linked 사용자**
  - 자신의 Discord 정체성을 ClawPark에 연결하고
  - 추후 publish/provenance/claim attribution에 활용하고 싶음

#### Quaternary
- **Discord conversational 사용자**
  - Discord에서 Claw 또는 ClawPark bot에게 자연어로 breeding을 지시하고 싶음

### 5.2 핵심 JTBD
- “내 로컬 OpenClaw 개체 2개를 올려서 실제로 child를 만들고 lineage를 저장하고 싶다.”
- “ClawPark가 지금 무엇을 해야 하는지 스스로 알려주길 원한다.”
- “나중에 원하면 publish/share하고 싶지만, 처음부터 marketplace는 필요 없다.”
- “내 Discord 계정을 연결해, 내가 가져오고 publish한 개체에 verified identity를 붙이고 싶다.”
- “Discord에서 Claw나 ClawPark bot에게 ‘저 놈이랑 breed해’라고 말해 작업을 시키고 싶다.”

---

## 6. 핵심 사용자 흐름

### 6.1 Primary flow
1. 사용자가 ClawPark를 연다
2. **Home**에서 현재 상태를 본다
3. `Import OpenClaw`를 눌러 ZIP 2개를 업로드한다
4. 각 ZIP에 대해 preview를 본다
   - identity
   - soul
   - skills
   - tools
   - warnings
   - provenance
5. import된 개체를 **claim/local specimen**으로 저장한다
6. Nursery/Gallery에서 두 개체를 선택한다
7. Breed Lab에서 compatibility/prediction을 본다
8. prompt를 넣고 breed를 실행한다
9. child를 Birth/Lineage 화면에서 확인한다
10. child를 저장한다

### 6.2 Secondary flow
1. 사용자가 Discord 계정을 연결한다
2. Home에서 connected identity와 enabled capability를 확인한다
3. import한 specimen 또는 publish 대상에 Discord attribution이 반영된다

### 6.3 Tertiary flow
1. Home에서 “breedable pair exists”를 확인
2. 바로 Breed Lab 진입
3. lineage review 후 export or publish

### 6.4 Quaternary flow
1. 사용자가 Discord에서 ClawPark bot에게 breed 의도를 말한다
2. bot이 candidate, compatibility, eligibility, consent 상태를 설명한다
3. 사용자가 실행을 승인하면 breed run이 생성된다
4. bot이 lineage 요약과 결과를 반환한다

### 6.5 Quinary flow
1. 사용자가 Discord에서 skill-installed Claw에게 breed 의도를 말한다
2. 해당 Claw가 ClawPark backend를 조회해 후보를 찾는다
3. 상대 선택/consent/실행을 조율한다
4. 결과 lineage를 Discord 대화로 반환한다

### 6.6 Senary flow
1. child/specimen을 나중에 exchange에 publish
2. 다른 사용자가 browse/claim

---

## 7. 제품 정보구조

### 7.1 상위 메뉴 구조
- **Connect** (또는 Home 상단 onboarding card)
- **Home**
- **Import**
- **Nursery** (기존 Gallery 대체/확장)
- **Breed Lab**
- **Lineage**
- **Exchange** (기존 Marketplace를 후순위로 재배치)

### 7.2 각 영역 역할

#### Connect
- Discord 계정 연결/해제
- 현재 연결 상태
- verified identity 설명
- 연결이 필요한 기능과 선택 기능 안내

#### Discord Surfaces
- ClawPark Coordinator Bot
- skill-installed Claw
- 자연어 breed 요청
- candidate suggestion / consent / result delivery

#### Home
- 현재 상태 요약
- 다음 추천 액션
- warnings / pending claim / breedable pairs
- connected identity / onboarding state

#### Import
- OpenClaw ZIP 업로드
- parser preview
- import confirmation

#### Nursery
- 로컬 개체 목록
- claim 상태
- breed eligibility
- provenance summary

#### Breed Lab
- pair selection
- prompt
- conversation
- run breeding

#### Lineage
- child 결과
- inheritance map
- provenance
- transcript
- save/export

#### Exchange
- public publish/share
- browse/download/install
- non-core

---

## 8. Moltbook-style 계약 문서 설계

ClawPark는 아래 문서를 agent-readable contract로 제공해야 한다.

### 8.1 `skill.md`
포함 내용:
- 제품 소개
- base URL
- import 방법
- home 확인 방법
- breed 실행 방법
- lineage 조회 방법
- local-first / privacy 기본값

### 8.2 `heartbeat.md`
포함 내용:
- 얼마나 자주 체크할지
- `/home` 호출 방법
- 우선순위
  1. pending imports
  2. claim needed
  3. breedable pairs
  4. unsaved newborns
  5. lineage review
  6. optional publish

### 8.3 `breeding.md`
포함 내용:
- eligibility 확인
- breed run 생성
- save child
- lineage reading rules
- cooldown / failure semantics

### 8.4 `rules.md`
포함 내용:
- privacy
- provenance integrity
- unsafe file rejection
- overwrite policy
- import restrictions
- publish rules
- local-default policy

### 8.5 `skill.json`
포함 내용:
- metadata
- triggers
- api base
- required bins/tools
- docs file URLs

### 8.6 `onboarding.md` (선택)
포함 내용:
- Discord 연결 방법
- local-only mode와 Discord-linked mode 차이
- verified attribution이 적용되는 기능
- 연결 실패/해제 시 동작

### 8.7 `discord.md`
포함 내용:
- Discord interaction modes
- 자연어 command examples
- breeding orchestration lifecycle
- consent rules
- result/lineage response contract

---

## 9. 기능 요구사항

## 9.0 Discord Onboarding

### 요구사항
- 사용자는 Discord 계정을 ClawPark에 연결할 수 있어야 한다.
- 연결은 기존 Discord OAuth 흐름을 활용한다.
- Discord 연결은 **선택 사항**이어야 하며, local import/breed를 막아서는 안 된다.
- 연결 완료 후 시스템은 다음 정보를 표시할 수 있어야 한다:
  - display name
  - discord handle
  - avatar
  - connected state
- Discord 연결은 다음 기능에 활용될 수 있어야 한다:
  - verified publisher identity
  - specimen provenance attribution
  - claim/publish metadata

### 비범위
- Discord 채널 메시지를 통한 breed/import 실행의 전체 production rollout

### 수용 기준
- 사용자는 `Sign in with Discord`로 연결을 시작할 수 있어야 한다.
- 연결 성공 시 Home 또는 Connect 영역에서 connected identity를 확인할 수 있어야 한다.
- Discord 미연결 상태에서도 import와 breed는 가능해야 한다.
- publish 등 verified attribution이 필요한 기능은 Discord 연결 여부를 명확히 안내해야 한다.

---

## 9.0.1 Discord Interaction Modes

### 요구사항
- 시스템은 두 가지 Discord interaction mode를 구분해 정의해야 한다:
  1. **Coordinator Bot Mode**
  2. **Skill-installed Claw Mode**
- 두 모드는 가능한 한 동일한 backend breeding contract를 사용해야 한다.
- 자연어 기반 요청은 내부적으로 구조화된 breeding intent로 변환되어야 한다.

### Coordinator Bot Mode
- 사용자는 Discord에서 전용 ClawPark bot에게 말한다.
- bot은 candidate suggestion, eligibility check, consent state, breed execution, result delivery를 담당한다.
- MVP의 기본 Discord surface는 이 mode여야 한다.

### Skill-installed Claw Mode
- 사용자는 Discord에서 개별 Claw에게 말한다.
- 해당 Claw는 `clawpark skill`을 사용해 backend를 조회하고 orchestration을 위임하거나 일부 수행한다.
- 이 mode는 장기 비전이며, MVP에서는 protocol-compatible 수준까지 정의한다.

### 수용 기준
- 문서는 두 mode의 역할 차이를 명확히 설명해야 한다.
- MVP scope는 Coordinator Bot Mode 우선으로 정의되어야 한다.
- Skill-installed Claw Mode는 이후 확장 가능하도록 contract를 공유해야 한다.

## 9.1 Home

### 요구사항
- 시스템은 단일 Home payload를 제공해야 한다.
- Home은 최소 다음을 포함해야 한다:
  - `connected_identity`
  - `onboarding_state`
  - `owned_claw_count`
  - `pending_imports`
  - `unclaimed_imports`
  - `breedable_pairs`
  - `cooldowns`
  - `unsaved_newborns`
  - `recent_lineages`
  - `warnings`
  - `what_to_do_next`

### 수용 기준
- 사용자는 앱 진입 후 3초 이내에 “다음 액션”을 알 수 있어야 한다.
- 에이전트는 `/home` 한 번 호출로 다음 행동을 결정할 수 있어야 한다.

---

## 9.2 Import OpenClaw

### 요구사항
- 사용자는 ZIP 파일을 업로드할 수 있어야 한다.
- 시스템은 다음을 파싱해야 한다:
  - `IDENTITY.md`
  - `SOUL.md`
  - `TOOLS.md`
  - `skills/*/SKILL.md`
- 시스템은 다음을 추출해야 한다:
  - 이름/정체성
  - soul traits
  - skills
  - tools
  - warnings
  - fingerprint/provenance
- 시스템은 import preview를 제공해야 한다.

### 중요 설계 원칙
현재 parser는 heuristic 기반이어도 괜찮지만,  
**실제 capability는 `skills/*/SKILL.md`에서 우선적으로 읽어야 한다.**

### 수용 기준
- 사용자는 ZIP import 후 최소 1개의 specimen preview를 볼 수 있어야 한다.
- import 실패 시 명확한 warnings/error를 받아야 한다.
- denylist 파일은 차단되어야 한다.

---

## 9.3 Claim / Ownership

### 요구사항
- import된 개체는 즉시 active publish object가 아니라, 우선 **local claimed specimen**이 되어야 한다.
- 각 specimen은 다음 상태를 가진다:
  - `imported`
  - `claimed`
  - `breedable`
  - `cooldown`
  - `archived`
  - `published` (optional)
- Discord 계정이 연결된 경우, specimen은 optional한 verified attribution을 가질 수 있어야 한다.

### 수용 기준
- 사용자는 import 후 “내 로컬 개체”로 보관할 수 있어야 한다.
- provenance가 손실되지 않아야 한다.
- Discord 연결 여부가 local ownership 자체를 막아서는 안 된다.

---

## 9.4 Nursery

### 요구사항
- 로컬 소유 specimen 목록을 보여줘야 한다.
- 각 specimen card는 다음을 포함해야 한다:
  - avatar
  - name
  - identity summary
  - soul summary
  - skills summary
  - tools summary
  - breedable state
  - provenance badge

### 수용 기준
- 사용자는 Nursery에서 2개를 선택해 Breed Lab으로 바로 이동할 수 있어야 한다.

---

## 9.5 Breed Lab

### 요구사항
- 사용자는 parent A/B를 선택할 수 있어야 한다.
- 시스템은 compatibility/prediction을 보여줘야 한다.
- 사용자는 prompt를 입력할 수 있어야 한다.
- 시스템은 parent conversation 생성이 가능해야 한다.
- breed 실행 후 child result를 생성해야 한다.

### 수용 기준
- 두 개체를 선택하고 breed 실행 시 child가 실제 생성되어야 한다.
- 생성 결과에는 lineage가 포함되어야 한다.

---

## 9.5.1 Discord Breeding Orchestration

### 요구사항
- 시스템은 Discord 자연어 요청을 breeding intent로 해석할 수 있어야 한다.
- 최소 지원 intent 예시는 다음과 같다:
  - “나 이거 breed하고 싶어”
  - “저 놈이랑 breed해”
  - “breed 가능한 상대 찾아줘”
  - “이놈이랑 저놈이랑 breed하는게 어때?”
  - “진행해”
  - “취소해”
- 시스템은 아래 단계를 가진 orchestration lifecycle을 가져야 한다:
  1. `intent_created`
  2. `candidate_suggested`
  3. `consent_pending`
  4. `eligibility_checked`
  5. `run_started`
  6. `result_ready`
  7. `saved` or `cancelled`

### Discord 응답 계약
- Discord surface는 최소 다음을 반환할 수 있어야 한다:
  - 추천 후보
  - compatibility 요약
  - breed 불가 이유
  - consent 필요 여부
  - 진행 상태
  - lineage 요약
  - 결과 child 저장 여부

### 수용 기준
- Discord에서 사용자가 breed 의도를 말하면 시스템은 단순 실패가 아니라 다음 액션을 제안해야 한다.
- 실행 불가 시에도 block reason 또는 consent requirement를 설명해야 한다.
- 실행 성공 시 lineage summary를 Discord에서 읽을 수 있어야 한다.

---

## 9.5.2 Matchmaking & Consent

### 요구사항
- 시스템은 서로 다른 specimen ownership 상황을 구분해야 한다:
  - same-owner
  - same-linked-identity
  - cross-owner
  - unknown-owner
- same-owner 또는 동일 linked identity specimen은 자동 진행 가능 정책을 둘 수 있어야 한다.
- cross-owner specimen은 consent model을 통해 승인 상태를 관리해야 한다.
- consent requirement는 Discord 대화에서 분명히 설명되어야 한다.

### 수용 기준
- 사용자는 왜 breed가 바로 가능한지 또는 왜 보류되는지 이해할 수 있어야 한다.
- ownership/consent 상태는 orchestration lifecycle에 반영되어야 한다.

---

## 9.6 Lineage

### 요구사항
- child lineage 화면은 최소 다음을 보여야 한다:
  - parentA
  - parentB
  - inheritance map
  - doctrine
  - breeding conversation
  - provenance trail

### 수용 기준
- 사용자는 child가 무엇을 어디서 물려받았는지 읽을 수 있어야 한다.
- lineage는 gallery 저장 이후에도 보존되어야 한다.

---

## 9.7 Exchange (Post-MVP / Secondary)

### 요구사항
- Exchange는 import/breed 이후의 보조 기능으로 남긴다.
- publish/download/install/share를 담당한다.
- skill listing과 claw listing을 구분한다.

### 수용 기준
- core flow가 Exchange 없이 완결되어야 한다.

---

## 9.8 Verified Identity & Attribution

### 요구사항
- 시스템은 local/private mode와 Discord-linked verified mode를 구분해야 한다.
- Discord-linked mode에서는 publish/claim/provenance에 publisher identity를 기록할 수 있어야 한다.
- local/private mode에서도 모든 핵심 breed 기능은 유지되어야 한다.

### 수용 기준
- 사용자는 자신의 specimen 또는 listing이 local인지 verified-linked인지 구분해서 볼 수 있어야 한다.
- verified identity는 publish attribution에는 영향을 주되, local import/breed eligibility를 막지 않아야 한다.

---

## 10. API 제안

### 10.1 Core endpoints
- `GET /api/auth/session`
- `GET /api/auth/discord/start`
- `GET /api/auth/discord/callback`
- `GET /api/v1/home`
- `POST /api/v1/discord/intents`
- `GET /api/v1/discord/intents/:id`
- `POST /api/v1/imports/openclaw`
- `GET /api/v1/imports/:id`
- `POST /api/v1/specimens/:id/claim`
- `GET /api/v1/specimens`
- `GET /api/v1/specimens/:id`
- `GET /api/v1/breeding/eligibility?parentA=...&parentB=...`
- `POST /api/v1/breeding/proposals`
- `POST /api/v1/breeding/proposals/:id/consent`
- `POST /api/v1/breeding/runs`
- `GET /api/v1/breeding/runs/:id`
- `POST /api/v1/breeding/runs/:id/save`
- `GET /api/v1/lineages/:id`

### 10.2 Optional endpoints
- `POST /api/auth/logout`
- `POST /api/v1/specimens/:id/publish`
- `GET /api/v1/exchange/listings`
- `GET /api/v1/exchange/listings/:slug`

---

## 11. 데이터 모델

### 11.1 ImportRecord
- `id`
- `source_kind` (`openclaw_zip`)
- `uploaded_at`
- `included_files`
- `ignored_files`
- `warnings`
- `fingerprint`
- `parsed_specimen_id`

### 11.2 Specimen
- `id`
- `name`
- `identity`
- `soul`
- `skills`
- `tools`
- `visual`
- `intro`
- `provenance`
- `ownership_state`
- `breed_state`
- `verified_identity` (optional)

### 11.3 Provenance
- `source_kind`
- `source_hash`
- `import_record_id`
- `original_paths`
- `parser_version`
- `warnings`
- `claimed_by_discord_user_id` (optional)
- `claimed_by_discord_handle` (optional)

### 11.4 BreedingRun
- `id`
- `parent_a_id`
- `parent_b_id`
- `prompt`
- `conversation`
- `prediction`
- `result_child_id`
- `created_at`

### 11.5 BreedingIntent
- `id`
- `source_surface` (`discord_bot` | `discord_claw` | `web_ui`)
- `source_message`
- `requester_identity`
- `target_specimen_ids`
- `status`
- `suggested_candidates`
- `created_at`

### 11.6 BreedingConsent
- `id`
- `proposal_id`
- `owner_identity`
- `status` (`pending` | `approved` | `rejected` | `expired`)
- `responded_at`

### 11.7 HomePayload
- `summary`
- `connected_identity`
- `onboarding_state`
- `pending_claims`
- `breedable_pairs`
- `cooldowns`
- `unsaved_children`
- `recent_activity`
- `what_to_do_next`

---

## 12. UX 원칙

1. **한 화면에서 다음 액션이 보여야 한다**
2. **ZIP import가 가장 쉬워야 한다**
3. **Marketplace는 뒤로 물러나야 한다**
4. **실패도 설명 가능해야 한다**
5. **lineage는 “결과 화면”이 아니라 핵심 가치다**
6. **agent도 쓸 수 있고 사람도 쓸 수 있어야 한다**

---

## 13. 성공 지표

### MVP 성공 지표
- 사용자가 **OpenClaw ZIP 2개 import → breed 완료**까지 성공하는 비율
- import 실패 사유의 명확성
- breed run 성공률
- child save 성공률
- lineage 조회 성공률

### 운영 지표
- `/home` 사용률
- import 후 claim 전환율
- breedable pair detection 정확도
- parser warning 빈도
- exchange 사용률 (후순위)

---

## 14. MVP 범위

### 포함
- Discord onboarding/connect UX
- connected identity in Home
- Discord coordinator bot mode
- breeding intent / proposal / consent contract
- direct ZIP import
- workspace-aware parser
- Nursery
- Breed Lab
- Lineage save
- Home payload
- skill/heartbeat/rules/breeding/skill.json 문서

### 제외
- full multi-agent autonomous Claw-to-Claw negotiation
- production-grade guild-wide bot rollout
- slash command integration
- 진짜 public marketplace economy
- full social layer
- real-time collaboration
- cross-user breeding

---

## 15. 수용 기준 요약

MVP는 다음 문장으로 판별한다:

> **사용자는 로컬 OpenClaw ZIP 2개를 ClawPark에 올리고, 이를 claim한 뒤, 실제로 breed를 실행해 child lineage를 저장할 수 있어야 한다.**  
> 그리고  
> **에이전트는 ClawPark의 skill/heartbeat/home contract만 읽고도 이 흐름을 이해하고 수행할 수 있어야 한다.**
> 또한  
> **사용자는 원할 경우 Discord 계정을 연결해 verified identity를 붙일 수 있어야 하지만, 연결하지 않아도 핵심 local breeding 흐름은 수행 가능해야 한다.**
> 또한  
> **Discord에서 사용자가 자연어로 breed 의도를 말하면, 시스템은 후보 제안/동의 필요 여부/실행 결과를 대화형으로 반환할 수 있어야 한다.**

---

## 16. 리스크

1. **OpenClaw workspace 구조가 다양할 수 있음**
   - heuristic parser 보완 필요

2. **`skills/*/SKILL.md` 해석 품질 부족 가능성**
   - skill extraction 규칙 명확화 필요

3. **현재 Marketplace 컴포넌트가 과도하게 많은 역할 수행**
   - Import/Nursery/Exchange 분리 필요

4. **tracked runtime/local state가 제품 상태와 섞일 수 있음**
   - local/private state 구분 강화 필요

5. **Discord 연결의 범위가 과도하게 커질 수 있음**
   - OAuth identity 연결과 bot/guild integration을 혼동하지 않도록 범위를 엄격히 제한해야 함

6. **Discord 자연어 해석이 모호할 수 있음**
   - breeding intent parsing과 candidate suggestion 품질이 낮으면 사용자 신뢰를 해칠 수 있음

7. **consent/ownership 모델이 복잡해질 수 있음**
   - cross-owner breeding 규칙을 초기에 단순화하지 않으면 orchestration이 과도하게 무거워질 수 있음

---

## 17. 단계별 실행 계획

### Phase 1 — Contract foundation
- Discord onboarding spec
- Discord interaction/orchestration spec
- `skill.md`
- `heartbeat.md`
- `breeding.md`
- `discord.md`
- `rules.md`
- `skill.json`
- `/api/v1/home`

### Phase 2 — Real local breeding MVP
- Coordinator Bot Mode
- breeding intent / proposal / consent API
- direct ZIP import UI
- parser 개선 (`skills/*/SKILL.md`)
- Nursery
- breed run
- lineage save

### Phase 3 — Exchange
- existing marketplace를 Exchange로 재배치
- publish/share는 부가기능으로 이동

---

## 18. 참고 / 근거

이 PRD는 아래 문서의 패턴을 참고해 **ClawPark에 맞게 재해석한 설계안**입니다.

- Moltbook SKILL.md: https://www.moltbook.com/skill.md
- Moltbook HEARTBEAT.md: https://www.moltbook.com/heartbeat.md
- Moltbook MESSAGING.md: https://www.moltbook.com/messaging.md
- Moltbook RULES.md: https://www.moltbook.com/rules.md
- Moltbook skill.json: https://www.moltbook.com/skill.json
