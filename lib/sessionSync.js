import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Optional: backs up the WhatsApp session (Baileys auth files) to MongoDB so
// a lost/incomplete local session (e.g. a container restart that cuts off
// in-flight key writes) can be restored without a fresh QR pairing. Only
// active when MONGO_URL is set — the bot works exactly as before otherwise.
const MONGO_URL = process.env.MONGO_URL;
const SESSION_ID = process.env.SESSION_SYNC_ID || 'default';

let sessionModel = null;
let connectPromise = null;

function ensureConnected() {
    if (!MONGO_URL)
        return Promise.resolve(false);
    if (mongoose.connection.readyState === 1)
        return Promise.resolve(true);
    if (!connectPromise) {
        connectPromise = mongoose.connect(MONGO_URL)
            .then(() => true)
            .catch((err) => {
                console.error('[SESSION-SYNC] MongoDB connection error:', err.message);
                connectPromise = null;
                return false;
            });
    }
    return connectPromise;
}

function getModel() {
    if (!sessionModel) {
        const schema = new mongoose.Schema({
            sessionId: { type: String, unique: true },
            files: { type: mongoose.Schema.Types.Mixed, default: {} },
            updatedAt: Date,
        });
        sessionModel = mongoose.models.BotSession || mongoose.model('BotSession', schema);
    }
    return sessionModel;
}

/**
 * If the local session has no creds yet, try restoring the last full
 * snapshot from MongoDB. Returns true if it restored something.
 */
export async function pullSessionFromMongoIfNeeded(sessionDir) {
    if (!MONGO_URL)
        return false;
    const credsPath = path.join(sessionDir, 'creds.json');
    if (fs.existsSync(credsPath))
        return false;
    const connected = await ensureConnected();
    if (!connected)
        return false;
    try {
        const doc = await getModel().findOne({ sessionId: SESSION_ID });
        const files = doc?.files;
        if (!files || Object.keys(files).length === 0)
            return false;
        fs.mkdirSync(sessionDir, { recursive: true });
        for (const [name, b64] of Object.entries(files)) {
            fs.writeFileSync(path.join(sessionDir, name), Buffer.from(b64, 'base64'));
        }
        console.log(`[SESSION-SYNC] Restored ${Object.keys(files).length} session file(s) from MongoDB`);
        return true;
    }
    catch (err) {
        console.error('[SESSION-SYNC] Failed to restore session from MongoDB:', err.message);
        return false;
    }
}

/**
 * Upload every file currently in the session directory to MongoDB as one
 * document. Meant to be called after every creds.update, same as Baileys'
 * own saveCreds, so the remote copy stays fresh as the session fills in.
 */
export async function pushSessionToMongo(sessionDir) {
    if (!MONGO_URL)
        return;
    const connected = await ensureConnected();
    if (!connected)
        return;
    try {
        if (!fs.existsSync(sessionDir))
            return;
        const entries = fs.readdirSync(sessionDir);
        const files = {};
        for (const name of entries) {
            const filePath = path.join(sessionDir, name);
            if (fs.statSync(filePath).isFile()) {
                files[name] = fs.readFileSync(filePath).toString('base64');
            }
        }
        if (Object.keys(files).length === 0)
            return;
        await getModel().updateOne({ sessionId: SESSION_ID }, { $set: { files, updatedAt: new Date() } }, { upsert: true });
    }
    catch (err) {
        console.error('[SESSION-SYNC] Failed to push session to MongoDB:', err.message);
    }
}
