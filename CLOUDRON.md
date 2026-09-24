# Deploying MEGA-MD on Cloudron (allhands / Cobra)

This fork adds custom Cloudron packaging on top of upstream MEGA-MD:

- `Dockerfile.cloudron` — Cloudron-compatible image (Node 20 + ffmpeg + build tools on `cloudron/base:5.0.0`)
- `start.sh` — copies the read-only `/app/code` to a writable `/tmp/app` on every boot (this codebase writes ad-hoc files all over its own tree: `logs/`, `XeonMedia/trash/`, `lib/bin/`, etc), then symlinks `session/`, `data/`, `temp/` and `.env` back into `/app/data` (the only path Cloudron persists across image rebuilds) so the WhatsApp session and settings survive updates
- `CloudronManifest.json` — app manifest (port 5000, `localstorage` + `mongodb` addons)
- `patches/@whiskeysockets+baileys+*.patch` — applied via `postinstall: patch-package`, fixes a Baileys bug where WhatsApp's `companion_reg_refresh` notification (shipped ~July 2026) isn't handled, which otherwise breaks pairing-code linking (QR linking is unaffected)

## Before building

1. Drop a 256x256 `logo.png` in the repo root (referenced by `CloudronManifest.json`). Without it, `cloudron build`/`docker build` for the manifest step will fail validation.
2. Have Docker + the Cloudron CLI (`npm install -g cloudron`) available where you build, and `cloudron login <your-domain>` done.
3. Make sure the platform's `mongodb` service is actually provisioned on your Cloudron instance before adding the `mongodb` addon to the manifest (see [MongoDB gotcha](#mongodb-gotcha-container-not-found) below) — otherwise the install/update will fail with `mongodb container not found` and can take the app offline.

## Build & install

```sh
# from the repo root
cloudron build -f Dockerfile.cloudron --repository <your-registry>/com.allhands.megamd
cloudron install --image <your-registry>/com.allhands.megamd:<tag> --location bot.yourdomain.com

# subsequent deploys
cloudron update --app <app-id> --image <your-registry>/com.allhands.megamd:<tag>
```

## First-time configuration (pairing the WhatsApp number)

The container has no session on first boot. `start.sh` copies `sample.env` to `/app/data/.env` automatically. To configure it:

```sh
cloudron exec --app <app-id> -- nano /app/data/.env
```

Fill in at minimum:
- `PAIR_MODE=qr` — QR pairing. **Pairing-code linking (`SESSION_ID`/`PAIRING_NUMBER`) is currently broken** by a WhatsApp protocol change (`companion_reg_refresh`) that Baileys doesn't fully handle yet, even with the patch in this fork — QR is the only reliable method right now.
- `OWNER_NUMBER` — your admin WhatsApp number
- `BOT_NAME`, `PACKNAME`, `PREFIXES`, `TIMEZONE` — cosmetic/behavioral config

Then restart:

```sh
cloudron restart --app <app-id>
```

Scan the QR code either by opening `https://bot.yourdomain.com/` in a browser (it auto-refreshes every few seconds until scanned or connected) or by tailing the logs for the terminal QR:

```sh
cloudron logs --app <app-id> -f
```

Scan from **WhatsApp → ⋮ Menu → Linked Devices → Link a Device** on the number you're dedicating to the bot.

## MongoDB addon

`CloudronManifest.json` includes `"mongodb": {}`. `start.sh` bridges Cloudron's injected `CLOUDRON_MONGODB_URL` to `MONGO_URL` (the variable the app's own code reads everywhere), so once the addon is active the bot automatically:

- Switches its storage backend from flat JSON files to Mongo, which fixes per-group settings (antilink, antispam, `.groupantidelete`, etc) that the JSON backend stores flat/shared across all groups instead of scoped per chat.
- Backs up the Baileys session (`lib/sessionSync.js`) on every credential update, and restores it on boot if the local session is empty — mitigates session loss across container restarts/redeploys.

### MongoDB gotcha: "container not found"

Cloudron treats `mongodb` (like `mysql` and `turn`) as a **lazy service** — its shared platform container is only created the first time an app enables the addon, via `ensureServiceRunning()` in Cloudron's own `services.js`. On some installs (e.g. ones that never had a Mongo-using app before), that container was never created, and enabling the addon fails outright with `mongodb container not found` — deleting the app's old container in the process, causing an outage.

If you hit this, the container needs to be created once, independently of any app install/update:

- **Dashboard**: go to **Services** → **MongoDB** → **Configurar**, toggle **Ativar Modo de Recuperação** (Enable Recovery Mode) on and save, then open it again, toggle it back off and save. Each toggle triggers Cloudron's `rebuildService`, which (re)creates the `mongodb` container from the platform's pinned image.
- Only add/re-add `"mongodb": {}` to `CloudronManifest.json` and run `cloudron update` **after** the Services page shows MongoDB as healthy (green), to avoid repeating the outage.

## Updating from upstream

This repo has `upstream` pointing at `GlobalTechInfo/MEGA-MD`. To pull new commits:

```sh
git fetch upstream
git merge upstream/main
git push origin main
```

Then rebuild and reinstall the image on Cloudron (`cloudron update --app <app-id> --image <new-image>`).
