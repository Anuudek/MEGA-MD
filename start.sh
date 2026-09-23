#!/bin/bash
set -eu

DATA_DIR=/app/data
CODE_DIR=/app/code

# /app/code is read-only at runtime on Cloudron. The Dockerfile already
# symlinked session/, data/, temp/ and .env inside it to /app/data, so we
# only need to make sure the real targets exist here (writable).
mkdir -p "$DATA_DIR/session" "$DATA_DIR/data" "$DATA_DIR/temp" "$DATA_DIR/logs"

if [[ ! -f "$DATA_DIR/.env" ]]; then
    cp "$CODE_DIR/sample.env" "$DATA_DIR/.env"
    echo "==> First boot: created $DATA_DIR/.env from sample.env."
    echo "==> Set SESSION_ID (or PAIRING_NUMBER) via:"
    echo "==>   cloudron exec --app <app-id> -- nano /app/data/.env"
    echo "==> then restart the app: cloudron restart --app <app-id>"
fi

cd "$CODE_DIR"
exec node index.js
