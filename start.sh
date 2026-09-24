#!/bin/bash
set -eu

DATA_DIR=/app/data
SRC_DIR=/app/code
RUN_DIR=/tmp/app

mkdir -p "$DATA_DIR/session" "$DATA_DIR/data" "$DATA_DIR/temp" "$DATA_DIR/logs"

# /app/code is read-only at runtime on Cloudron, but this codebase writes
# ad-hoc files/dirs all over its own tree (logs/, XeonMedia/trash/, lib/bin/,
# session/, data/, ...). Rather than chase every write site, copy the whole
# app to a writable scratch dir on every boot and run from there.
rm -rf "$RUN_DIR"
cp -a "$SRC_DIR" "$RUN_DIR"

# Point the directories we actually want to survive restarts/updates back to
# the persistent volume.
rm -rf "$RUN_DIR/session" "$RUN_DIR/data" "$RUN_DIR/temp"
ln -s "$DATA_DIR/session" "$RUN_DIR/session"
ln -s "$DATA_DIR/data" "$RUN_DIR/data"
ln -s "$DATA_DIR/temp" "$RUN_DIR/temp"

if [[ ! -f "$DATA_DIR/.env" ]]; then
    cp "$SRC_DIR/sample.env" "$DATA_DIR/.env"
    echo "==> First boot: created $DATA_DIR/.env from sample.env."
    echo "==> Set SESSION_ID (or PAIRING_NUMBER) via:"
    echo "==>   cloudron exec --app <app-id> -- nano /app/data/.env"
    echo "==> then restart the app: cloudron restart --app <app-id>"
fi
ln -sfn "$DATA_DIR/.env" "$RUN_DIR/.env"

# The app's own code (plugins, lightweight_store.js) checks process.env.MONGO_URL
# directly everywhere to decide whether a database is available. Cloudron's
# mongodb addon injects CLOUDRON_MONGODB_URL instead, so bridge it here rather
# than touching every file that reads MONGO_URL.
if [[ -n "${CLOUDRON_MONGODB_URL:-}" && -z "${MONGO_URL:-}" ]]; then
    export MONGO_URL="$CLOUDRON_MONGODB_URL"
fi

cd "$RUN_DIR"
exec node index.js
