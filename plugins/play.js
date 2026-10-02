import yts from 'yt-search';
import axios from 'axios';
import { downloadAudio, cleanup } from '../lib/ytdlp.js';

export default {
    command: 'play',
    aliases: ['plays'],
    category: 'music',
    description: 'Search and download a song as MP3 from YouTube',
    usage: '.play <song name>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args.join(' ').trim();
        if (!query)
            return sock.sendMessage(chatId, { text: '*Which song do you want to play?*\nUsage: .play <song name>' }, { quoted: message });
        let audioPath;
        try {
            await sock.sendMessage(chatId, { text: '🔍 *Searching...*' }, { quoted: message });
            const { videos } = await yts(query);
            if (!videos?.length)
                return sock.sendMessage(chatId, { text: '❌ *No results found!*' }, { quoted: message });
            const video = videos[0];
            await sock.sendMessage(chatId, {
                text: `✅ *Found:* ${video.title}\n⏱️ ${video.timestamp}\n👤 ${video.author.name}\n\n⏳ *Downloading... (this may take up to a minute)*`
            }, { quoted: message });
            audioPath = await downloadAudio(video.url);
            let thumbnailBuffer;
            try {
                const img = await axios.get(video.thumbnail, { responseType: 'arraybuffer', timeout: 15000 });
                thumbnailBuffer = Buffer.from(img.data);
            }
            catch { /* no thumbnail */ }
            await sock.sendMessage(chatId, {
                audio: { url: audioPath },
                mimetype: 'audio/mpeg',
                fileName: `${video.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: video.title,
                        body: `${video.author.name} • ${video.timestamp}`,
                        thumbnail: thumbnailBuffer,
                        mediaType: 2,
                        sourceUrl: video.url
                    }
                }
            }, { quoted: message });
        }
        catch (err) {
            console.error('Play error:', err.message);
            await sock.sendMessage(chatId, { text: `❌ *Failed:* ${err.message}` }, { quoted: message });
        }
        finally {
            cleanup(audioPath);
        }
    }
};
