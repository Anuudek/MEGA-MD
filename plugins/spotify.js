import axios from 'axios';
import yts from 'yt-search';
import { downloadAudio, cleanup } from '../lib/ytdlp.js';

async function getSpotifyTrackInfo(url) {
    const { data: html } = await axios.get(url, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]*)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"/);
    const title = titleMatch ? titleMatch[1] : null;
    // og:description looks like "Artist1, Artist2 · Track Title · Song · Year"
    const artist = descMatch ? descMatch[1].split(' · ')[0] : null;
    if (!title) throw new Error('Could not read track info from that Spotify link');
    return { title, artist, cover: imageMatch ? imageMatch[1] : null };
}

export default {
    command: 'spotify',
    aliases: ['sptfdl', 'spotifydl'],
    category: 'download',
    description: 'Find a Spotify track on YouTube and send the audio',
    usage: '.spotify <spotify-url>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const url = args.join(' ').trim();
        if (!url || !url.includes('spotify.com')) {
            return sock.sendMessage(chatId, {
                text: '🎵 *Spotify Downloader*\n\nUsage: `.spotify <spotify track url>`\nExample: `.spotify https://open.spotify.com/track/4LMlVCXHJtCE9abhmn0mYo`\n\n_Spotify audio is DRM-protected, so this finds the same song on YouTube instead._'
            }, { quoted: message });
        }
        let audioPath;
        try {
            await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });
            const track = await getSpotifyTrackInfo(url);
            const searchQuery = track.artist ? `${track.artist} - ${track.title}` : track.title;
            const { videos } = await yts(searchQuery);
            if (!videos?.length) {
                return sock.sendMessage(chatId, { text: `❌ Couldn't find "${searchQuery}" on YouTube.` }, { quoted: message });
            }
            const video = videos[0];
            const caption = [
                `🎵 *${track.title}*`,
                track.artist ? `👤 ${track.artist}` : '',
                `\n_Encontrado no YouTube: ${video.title}_`
            ].filter(Boolean).join('\n');
            await sock.sendMessage(chatId, {
                image: { url: track.cover || video.thumbnail },
                caption
            }, { quoted: message });
            audioPath = await downloadAudio(video.url);
            await sock.sendMessage(chatId, {
                audio: { url: audioPath },
                mimetype: 'audio/mpeg',
                fileName: `${track.title.replace(/[\\/:*?"<>|]/g, '')}.mp3`
            }, { quoted: message });
        }
        catch (error) {
            console.error('[SPOTIFY] error:', error.message);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
        finally {
            cleanup(audioPath);
        }
    }
};
