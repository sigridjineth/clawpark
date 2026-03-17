# ClawPark Dev Deployment Guide

This document is a practical **dev / private deployment guide** for running ClawPark on a machine you control (for example a DGX Spark) and exposing it through **Cloudflare Tunnel**.

It is written for the current ClawPark architecture:
- Vite frontend built into `dist/`
- Node HTTP server in `server/index.ts`
- SQLite + local filesystem storage
- optional Discord OAuth for verified publish
- optional direct marketplace skill install into an OpenClaw skills directory

---

## 1. Recommended topology

For this repo, the fastest stable deployment is:

- **one Linux host** running ClawPark
- **one Node process** serving both the built frontend and the API
- **one Cloudflare Tunnel** forwarding public HTTPS traffic to `http://127.0.0.1:8787`
- **SQLite + local storage** kept on that same machine

That matches the codebase well because the server currently expects:
- local writable storage for marketplace data,
- local SQLite,
- and, if you want direct skill installation, access to the same filesystem as your OpenClaw workspace.

---

## 2. Important constraints before you deploy

### Direct skill install only works when the server can write to the target skills directory
The new marketplace install flow is **server-side**. That means ClawPark itself writes the installed skill into an OpenClaw skills directory.

For direct install to work, the ClawPark server must:
- run on the **same machine** as the OpenClaw workspace, or at least have access to the same target directory,
- run under a user that has write permission to that directory,
- have the `unzip` CLI installed.

If those assumptions are not true, the UI still supports:
- **Download Skill**
- **Copy install steps**

### This deployment should be treated as dev/private unless you harden it
Right now the app includes unsigned ingest endpoints for local skill publishing. For a public internet deployment, you should assume:
- anything behind the hostname is public unless you protect it,
- unsigned publish routes should not be internet-open unless you really want that.

For that reason, **Cloudflare Access is strongly recommended** even for dev.

---

## 3. Host prerequisites

Assuming your DGX Spark is running Ubuntu or another systemd-based Linux:

Install:
- `git`
- `curl`
- `unzip`
- Node.js (use the same major line you verified locally if possible)
- `cloudflared`

Current repo verification has been done successfully with modern Node + npm and the built-in server start flow.

### Example package install
```bash
sudo apt update
sudo apt install -y git curl unzip
```

### Install Node.js
Use your preferred Node install method (`nvm`, NodeSource, distro packages, etc.).

Check:
```bash
node -v
npm -v
```

### Install cloudflared
Follow Cloudflare's official install instructions for Linux.

Official docs:
- Cloudflare downloads: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
- Tunnel setup: https://developers.cloudflare.com/tunnel/setup/

---

## 4. Clone and build ClawPark

```bash
cd /opt
sudo git clone https://github.com/sigridjineth/clawpark.git
sudo chown -R $USER:$USER clawpark
cd /opt/clawpark
npm install
npm run build
```

The build creates `dist/`, and the Node server can serve that built frontend directly.

---

## 5. Choose your data/storage locations

By default the server stores marketplace data locally. For a dev deployment, choose a stable writable directory.

Recommended:
- app repo: `/opt/clawpark`
- marketplace storage: `/opt/clawpark/marketplace-data`
- OpenClaw workspace: `/opt/openclaw-workspace` (example)

If you want direct install into the OpenClaw workspace-local skills directory, the default target should resolve to:

```bash
/opt/openclaw-workspace/skills/<slug>
```

If you want shared user-level installs instead, use:

```bash
~/.openclaw/skills/<slug>
```

---

## 6. Environment variables

Create an env file for the service.

Example: `/opt/clawpark/.env.production`

```bash
MARKETPLACE_HOST=127.0.0.1
MARKETPLACE_PORT=8787
MARKETPLACE_PUBLIC_ORIGIN=https://clawpark-dev.example.com
MARKETPLACE_CLIENT_ORIGIN=https://clawpark-dev.example.com
MARKETPLACE_STORAGE_DIR=/opt/clawpark/marketplace-data
MARKETPLACE_SESSION_SECRET=replace-with-a-long-random-secret

# OpenClaw install paths
MARKETPLACE_OPENCLAW_WORKSPACE=/opt/openclaw-workspace
# Optional shared fallback instead of workspace-local ./skills
# MARKETPLACE_SKILL_INSTALL_DIR=/home/your-user/.openclaw/skills

# Discord OAuth (only if you want verified publish)
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_REDIRECT_URI=https://clawpark-dev.example.com/api/auth/discord/callback
```

### Notes

#### `MARKETPLACE_PUBLIC_ORIGIN`
Must match the real public HTTPS URL users will open.

#### `MARKETPLACE_CLIENT_ORIGIN`
For this single-host deployment, set it to the same public origin.

#### `MARKETPLACE_OPENCLAW_WORKSPACE`
If set, the default install target becomes:

```bash
$MARKETPLACE_OPENCLAW_WORKSPACE/skills/<slug>
```

#### `MARKETPLACE_SKILL_INSTALL_DIR`
If set, it overrides the install root completely.

Use this if you prefer a shared directory such as:

```bash
/home/your-user/.openclaw/skills
```

#### Discord config
If you do not need verified publish immediately, you can leave Discord variables empty and use only the unsigned local publish flow.

---

## 7. First local smoke test before Cloudflare

Run the server locally first.

```bash
cd /opt/clawpark
set -a
source ./.env.production
set +a
node --experimental-strip-types server/index.ts
```

Then from the same machine:

```bash
curl -I http://127.0.0.1:8787
curl http://127.0.0.1:8787/api/auth/session
```

If the build is present and the server is healthy:
- `/` should return the app,
- `/api/auth/session` should return JSON.

---

## 8. Run ClawPark as a systemd service

Create `/etc/systemd/system/clawpark.service`:

```ini
[Unit]
Description=ClawPark dev server
After=network.target

[Service]
Type=simple
User=YOUR_USER
WorkingDirectory=/opt/clawpark
EnvironmentFile=/opt/clawpark/.env.production
ExecStart=/usr/bin/env node --experimental-strip-types server/index.ts
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now clawpark
sudo systemctl status clawpark
```

Useful logs:

```bash
journalctl -u clawpark -f
```

### Deploy update flow
Whenever you update code:

```bash
cd /opt/clawpark
git pull
npm install
npm run build
sudo systemctl restart clawpark
```

---

## 9. Expose it with Cloudflare Tunnel

You have two practical options.

### Option A — Quick tunnel for immediate testing
Fastest way to test external reachability:

```bash
cloudflared tunnel --url http://127.0.0.1:8787
```

Cloudflare will print a temporary `trycloudflare.com` URL.

Use this only for quick validation.

Cloudflare docs note that quick tunnels are for testing and have limitations.
Reference:
- https://developers.cloudflare.com/tunnel/setup/
- https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/

### Option B — Named tunnel for stable dev deployment (recommended)
This is the right path if you want a stable hostname like:

```text
https://clawpark-dev.example.com
```

High-level steps:
1. In Cloudflare Zero Trust / Tunnel dashboard, create a tunnel.
2. Create a public hostname pointing to:
   - service: `http://127.0.0.1:8787`
3. Install `cloudflared` on the DGX Spark.
4. Install the tunnel as a service using the token generated by Cloudflare.

Cloudflare's current docs show the service install flow as:

```bash
sudo cloudflared service install <TUNNEL_TOKEN>
```

Then:

```bash
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared
```

Official docs:
- https://developers.cloudflare.com/tunnel/setup/

---

## 10. Strongly recommended: protect the hostname with Cloudflare Access

Because this app exposes draft/publish/upload/install behavior, do **not** leave the tunnel public unless that is intentional.

Recommended setup:
- create a **self-hosted application** in Cloudflare Access,
- restrict access to your email / identity provider group,
- put the tunnel hostname behind that Access policy.

Cloudflare explicitly recommends protecting self-hosted apps this way.
Reference:
- https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-apps/

Why this matters for ClawPark:
- unsigned publish endpoints are otherwise reachable,
- draft upload and install endpoints should not be globally exposed for a casual dev deployment,
- Access gives you a fast identity gate without rewriting the app.

---

## 11. Discord OAuth settings behind Cloudflare

If you want verified publish through Discord:

1. use the **Cloudflare public hostname** as the public app URL,
2. update Discord OAuth settings to use the callback:

```text
https://clawpark-dev.example.com/api/auth/discord/callback
```

3. make sure these match exactly:

```bash
MARKETPLACE_PUBLIC_ORIGIN=https://clawpark-dev.example.com
MARKETPLACE_CLIENT_ORIGIN=https://clawpark-dev.example.com
DISCORD_REDIRECT_URI=https://clawpark-dev.example.com/api/auth/discord/callback
```

If they do not match, login will usually fail with redirect or state mismatch issues.

---

## 12. Direct skill install behavior in this deployment

With the current implementation, Marketplace skill install works like this:

1. user clicks **Install into OpenClaw**,
2. frontend calls `POST /api/marketplace/listings/:slug/install`,
3. server reads the stored sanitized ZIP,
4. server extracts the ZIP into the configured skills root,
5. if a skill already exists, the server returns a conflict until overwrite is explicitly confirmed.

### Good fit
This is a good fit when:
- ClawPark and OpenClaw live on the same DGX Spark,
- you want one-click install into that machine's workspace.

### Not a good fit
This is **not** the right path when:
- users are browsing from random remote machines,
- the ClawPark host does not own the target workspace,
- you expect the server to install into the end user's local laptop automatically.

In those cases, the correct path is still:
- download the skill bundle,
- copy install steps,
- install manually on the actual OpenClaw machine.

---

## 13. Persistence and backup

ClawPark stores dev marketplace state locally. At minimum, back up:

- the SQLite database under your marketplace storage dir,
- stored listing artifacts under the same storage dir,
- your `.env.production` file,
- your OpenClaw workspace if you use direct install.

Simple dev backup example:

```bash
tar czf /opt/backups/clawpark-$(date +%F).tar.gz /opt/clawpark/marketplace-data /opt/clawpark/.env.production
```

---

## 14. Practical verification checklist

After deployment, verify in this order:

### App and API
- `https://clawpark-dev.example.com/` loads
- `https://clawpark-dev.example.com/api/auth/session` returns JSON
- Marketplace browse works

### Publish / bundle flows
- upload a Claw ZIP draft (if Discord publish is enabled)
- ingest a local skill via the publisher flow
- skill listing appears in Marketplace
- download skill ZIP works

### Direct install flow
- click **Install into OpenClaw** on a skill listing
- confirm first install succeeds
- click install again and confirm conflict/overwrite prompt behavior
- confirm installed files exist in the target directory

### OAuth
- Discord login opens
- callback returns to the Marketplace publish screen
- draft/publish flow works if credentials are configured

---

## 15. Troubleshooting

### Root page does not load
Usually means either:
- `dist/` was not built,
- the app service is not running,
- Cloudflare Tunnel is pointing to the wrong local port.

Check:
```bash
sudo systemctl status clawpark
curl -I http://127.0.0.1:8787
```

### Discord login fails
Check all three values match the real public hostname:
- `MARKETPLACE_PUBLIC_ORIGIN`
- `MARKETPLACE_CLIENT_ORIGIN`
- `DISCORD_REDIRECT_URI`

### Skill install fails immediately
Check:
- `unzip` is installed,
- the app service user has write permission to the configured skills dir,
- `MARKETPLACE_OPENCLAW_WORKSPACE` or `MARKETPLACE_SKILL_INSTALL_DIR` points where you think it does.

### Install returns conflict
That is expected when the skill already exists and overwrite was not explicitly requested.

### Cloudflare tunnel is up but app is unreachable
Check:
- the tunnel service is healthy,
- the public hostname points to `http://127.0.0.1:8787`,
- local firewall rules are not interfering,
- ClawPark itself is healthy locally before blaming Cloudflare.

### Direct install is the wrong model for your setup
If the DGX Spark is **not** the machine that should own the OpenClaw workspace, disable reliance on direct install and use only:
- download,
- copy install steps,
- manual install on the real OpenClaw machine.

---

## 16. Recommended dev rollout order

If you want the fastest path to a usable deployment:

1. deploy ClawPark locally on the DGX Spark
2. verify `http://127.0.0.1:8787` works
3. test with a **quick tunnel**
4. switch to a **named tunnel** with a stable hostname
5. add **Cloudflare Access**
6. wire Discord OAuth only after the hostname is stable
7. test skill install against a real OpenClaw workspace on that same machine

That sequence minimizes the number of moving parts you debug at once.

---

## 17. References

Official references used for this guide:

- Cloudflare Tunnel setup:
  - https://developers.cloudflare.com/tunnel/setup/
- cloudflared downloads:
  - https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
- Quick tunnels / TryCloudflare:
  - https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/
- Cloudflare Access for self-hosted apps:
  - https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-apps/

