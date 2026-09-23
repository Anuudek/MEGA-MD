#!/bin/bash
set -eu

DATA_DIR=/app/data
CODE_DIR=/app/code

mkdir -p "$DATA_DIR/session" "$DATA_DIR/data" "$DATA_DIR/temp" "$DATA_DIR/logs"

# Persist everything Baileys/MEGA-MD writes at runtime by symlinking it into
# /app/data (the only directory Cloudron backs up and keeps across image
# rebuilds). Re-linking on every boot means an app update never wipes the
# WhatsApp session or the JSON/sqlite store.
rm -rf "$CODE_DIR/session" "$CODE_DIR/data" "$CODE_DIR/temp"
ln -sfn "$DATA_DIR/session" "$CODE_DIR/session"
ln -sfn "$DATA_DIR/data" "$CODE_DIR/data"
ln -sfn "$DATA_DIR/temp" "$CODE_DIR/temp"

if [[ ! -f "$DATA_DIR/.env" ]]; then
    cp "$CODE_DIR/sample.env" "$DATA_DIR/.env"
    echo "==> First boot: created $DATA_DIR/.env from sample.env."
    echo "==> Set SESSION_ID (or PAIRING_NUMBER) via:"
    echo "==>   cloudron exec --app <app-id> -- nano /app/data/.env"
    echo "==> then restart the app: cloudron restart --app <app-id>"
fi
ln -sfn "$DATA_DIR/.env" "$CODE_DIR/.env"

cd "$CODE_DIR"
exec node index.js
