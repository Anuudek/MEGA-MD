import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import fs from 'fs';
import axios from 'axios';
// Was hardcoded to a third party's ('stormfiber') GitHub account, which
// would have pointed every deployment at gists that account controls.
// Must be the account that actually owns the session Gist.
const GITHUB_USERNAME = process.env.GIST_GITHUB_USERNAME || 'Anuudek';
/**
 * Save credentials from GitHub Gist to session/creds.json
 * @param {string} txt - Gist ID with optional "owner/repo_" prefix
 */
async function SaveCreds(txt) {
    const __dirname = path.dirname(__filename);
    const gistId = txt.replace(/^[^/]+\/[^_]+_/, '');
    const gistUrl = `https://gist.githubusercontent.com/${GITHUB_USERNAME}/${gistId}/raw/creds.json`;
    try {
        const response = await axios.get(gistUrl);
        const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        const sessionDir = path.join(process.cwd(), 'session');
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }
        const credsPath = path.join(sessionDir, 'creds.json');
        fs.writeFileSync(credsPath, data);
    }
    catch (error) {
        console.error('❌ Error downloading or saving credentials:', error.message);
        if (error.response) {
            console.error('❌ Status:', error.response.status);
            console.error('❌ Response:', error.response.data);
        }
        throw error;
    }
}
export default SaveCreds;
