### ClawPark – Cloudflare D1 Deployment Status

#### Current status

- **Backend runtime**: Cloudflare Worker with **D1** bound as `env.DB`.
- **Deployed URL (Worker)**: `https://clawpark-marketplace.clawparkagents.workers.dev`
- **Database**:
  - D1 database name: `clawpark-db`
  - Schema applied from `db/schema.sql`.
- **Config**:
  - `wrangler.toml` points `main` to `server/worker.ts`.
  - `compatibility_flags = ["nodejs_compat"]` enabled for Node APIs.
  - Runtime config (origins, session secret, etc.) provided via env/Cloudflare (no secrets in git).
- **Code structure**:
  - Shared DB abstraction in `server/db.ts`.
  - D1-backed adapter in `server/db-worker.ts`.
  - Worker entry + routing skeleton in `server/worker.ts` (core health-check routes live; more routes can be ported from `server/index.ts` as needed).

#### How to deploy backend updates

From the repo root:

```bash
npm run deploy:worker
```

This runs `wrangler deploy` using `wrangler.toml`, uploading the latest Worker code and using the existing D1 binding.

If you need to (re)apply the schema:

```bash
wrangler d1 execute clawpark-db --file=db/schema.sql --local   # dev/local
wrangler d1 execute clawpark-db --file=db/schema.sql           # production
```

#### How to test that the Worker is healthy

In a browser:

- **OpenAPI JSON (pure API check)**  
  `https://clawpark-marketplace.clawparkagents.workers.dev/api/openapi.json`
  - Expect: HTTP 200 and a JSON document describing the API.

- **API docs HTML**  
  `https://clawpark-marketplace.clawparkagents.workers.dev/api/docs`
  - Expect: HTTP 200 and a rendered HTML docs page.

From a terminal:

```bash
curl -i https://clawpark-marketplace.clawparkagents.workers.dev/api/openapi.json

curl -i https://clawpark-marketplace.clawparkagents.workers.dev/api/docs
```

Look for `HTTP/1.1 200 OK` and non-empty bodies. Any 4xx/5xx responses (or 501 “not implemented”) indicate routes that still need to be fully ported from `server/index.ts` into `server/worker.ts`.

#### Frontend notes

- This deployment currently covers **only the backend Worker + D1**.
- The React frontend (Vite) can be:
  - Run locally with Vite, pointing API calls at the Worker URL, or
  - Deployed to Cloudflare Pages, using the Worker URL as its API base.

