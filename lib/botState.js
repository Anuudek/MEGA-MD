// Shared mutable state between index.js (owns the WhatsApp connection) and
// lib/server.js (renders it), so the pairing QR can be shown over HTTP
// instead of only in the container logs.
export const botState = {
    qr: null,
    connected: false,
};
