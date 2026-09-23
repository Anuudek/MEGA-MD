# Deploying MEGA-MD on Cloudron (allhands)

This fork adds custom Cloudron packaging on top of upstream MEGA-MD:

- `Dockerfile.cloudron` — Cloudron-compatible image (Node 20 + ffmpeg + build tools on `cloudron/base:5.0.0`)
- `start.sh` — symlinks `session/`, `data/`, `temp/` and `.env` into `/app/data` (the only path Cloudron persists across image rebuilds) so the WhatsApp session survives updates
- `CloudronManifest.json` — app manifest (port 5000, `localstorage` addon)

## Before building

1. Drop a 256x256 `logo.png` in the repo root (referenced by `CloudronManifest.json`). Without it, `cloudron build`/`docker build` for the manifest step will fail validation.
2. Have Docker + the Cloudron CLI (`npm install -g cloudron`) available where you build, and `cloudron login <your-domain>` done.

## Build & install

```sh
# from the repo root
docker build -f Dockerfile.cloudron -t <your-registry>/mega-md-cloudron:1.0.0 .
docker push <your-registry>/mega-md-cloudron:1.0.0

cloudron install --image <your-registry>/mega-md-cloudron:1.0.0 --location bot.yourdomain.com
```

(If you'd rather let Cloudron build it for you: rename `Dockerfile.cloudron` to `Dockerfile` locally — not committed that way on purpose, since the repo already ships an unrelated `Dockerfile` for the project's own quay.io image — and run `cloudron build` from this directory instead of the manual `docker build`/`push` steps above.)

## First-time configuration (pairing the WhatsApp number)

The container has no session on first boot. `start.sh` copies `sample.env` to `/app/data/.env` automatically. To configure it:

```sh
cloudron exec --app <app-id> -- nano /app/data/.env
```

Fill in at minimum:
- `SESSION_ID` — if you already have one, or leave empty and set `PAIRING_NUMBER` instead to get a pairing code in the logs on first boot
- `OWNER_NUMBER` — your admin WhatsApp number
- `BOT_NAME`, `PACKNAME`, `PREFIXES`, `TIMEZONE` — cosmetic/behavioral config

Then restart:

```sh
cloudron restart --app <app-id>
cloudron logs --app <app-id> -f
```

Watch the logs for the QR code / pairing code and complete pairing from the WhatsApp number you're dedicating to the bot.

## Updating from upstream

This repo has `upstream` pointing at `GlobalTechInfo/MEGA-MD`. To pull new commits:

```sh
git fetch upstream
git merge upstream/main
git push origin main
```

Then rebuild and reinstall the image on Cloudron (`cloudron update --app <app-id> --image <new-image>` or re-run `cloudron install` for the same location to redeploy).
