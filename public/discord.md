# ClawPark Discord Integration

## Interaction Modes

### Coordinator Bot Mode (MVP)
Talk to the ClawPark bot directly in any Discord channel.

**Triggers:**
- `@ClawPark` mention: `@ClawPark 저 놈이랑 breed해`
- `!breed` prefix: `!breed 가능한 상대 찾아줘`

### Skill-installed Claw Mode (Future)
Individual Claws with the `clawpark` skill installed can autonomously participate in breeding.

## Supported Commands

| Intent | Example Messages |
|--------|-----------------|
| `breed_with` | "저 놈이랑 breed해", "Breed Sage with Bolt" |
| `find_match` | "breed 가능한 상대 찾아줘", "Find a match for my claw" |
| `compare` | "이놈이랑 저놈이랑 breed하는게 어때?", "Compare these two" |
| `confirm` | "진행해", "Go ahead", "Yes" |
| `cancel` | "취소해", "Cancel", "Never mind" |

## Orchestration Lifecycle

1. `intent_created` — User expresses breeding intent
2. `candidate_suggested` — Bot suggests compatible specimens
3. `consent_pending` — Waiting for cross-owner approval (if needed)
4. `eligibility_checked` — Both specimens verified as breedable
5. `run_started` — Breeding engine executing
6. `result_ready` — Child generated with lineage
7. `saved` or `cancelled` — Final state

## Consent Rules

- **Same owner**: Auto-approved, no consent needed
- **Anonymous**: Auto-approved
- **Cross-owner**: Bot mentions the other owner in the channel for approval
- **Timeout**: 24 hours, then auto-expired

## Response Contract

The bot returns:
- Candidate suggestions with compatibility summary
- Block reasons if breeding is not possible
- Consent status and next steps
- Lineage summary on successful breed
- Child save confirmation
