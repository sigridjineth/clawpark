# ClawPark Breeding

## Eligibility

Check if two specimens can breed:

```
GET /api/v1/breeding/eligibility?parentA=id1&parentB=id2
```

Both specimens must be in `claimed` ownership state with `ready` breed state.

## Create a Breed Run

```
POST /api/v1/breeding/runs
{ "parentA": "id1", "parentB": "id2", "prompt": "optional breeding prompt" }
```

Returns the child specimen with inheritance map and mutation info.

## Save Child

```
POST /api/v1/breeding/runs/:id/save
```

## Lineage

```
GET /api/v1/lineages/:id
```

Returns full-depth recursive lineage tree (parents, grandparents, etc.).

## Breeding Intent (Discord / Agent)

```
POST /api/v1/discord/intents
{ "intent": "breed_with", "target_specimen_ids": ["id1", "id2"] }
```

## Consent

- Same-owner / anonymous: auto-approved
- Cross-owner: requires consent via `POST /api/v1/breeding/proposals/:id/consent`
- Consent expires after 24 hours

## Cooldown

MVP: No cooldown. Specimens are always ready to breed after completion.
