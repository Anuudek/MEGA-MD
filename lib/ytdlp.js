import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function runYtDlp(args, timeoutMs = 120000) {
    return new Promise((resolve, reject) => {
        const proc = spawn('yt-dlp', args, { windowsHide: true });
        let stderr = '';
        const timer = setTimeout(() => {
            proc.kill('SIGKILL');
            reject(new Error('yt-dlp timed out'));
        }, timeoutMs);
        proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
        proc.on('error', (err) => {
            clearTimeout(timer);
            reject(err);
        });
        proc.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0) resolve();
            else reject(new Error(stderr.trim().split('\n').pop() || `yt-dlp exited with code ${code}`));
        });
    });
}

function uniquePath(ext) {
    return path.join(TEMP_DIR, `ytdlp_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
}

/**
 * Downloads the best audio track for a YouTube URL and converts it to mp3.
 * Returns the local file path - caller is responsible for deleting it after use.
 */
export async function downloadAudio(url) {
    const outPath = uniquePath('mp3');
    const template = outPath.replace(/\.mp3$/, '.%(ext)s');
    await runYtDlp(['-x', '--audio-format', 'mp3', '--audio-quality', '0', '--no-playlist', '-o', template, url]);
    if (!fs.existsSync(outPath)) {
        throw new Error('Download finished but the mp3 file was not found');
    }
    return outPath;
}

/**
 * Downloads a YouTube video (capped at 480p to keep file sizes WhatsApp-friendly)
 * muxed to mp4. Returns the local file path - caller is responsible for deleting it after use.
 */
export async function downloadVideo(url) {
    const outPath = uniquePath('mp4');
    const template = outPath.replace(/\.mp4$/, '.%(ext)s');
    await runYtDlp([
        '-f', 'bestvideo[height<=480]+bestaudio/best[height<=480]',
        '--merge-output-format', 'mp4',
        '--no-playlist',
        '-o', template,
        url
    ]);
    if (!fs.existsSync(outPath)) {
        throw new Error('Download finished but the mp4 file was not found');
    }
    return outPath;
}

export function cleanup(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    catch { /* best effort */ }
}
