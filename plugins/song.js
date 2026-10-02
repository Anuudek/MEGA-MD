import yts from 'yt-search';
import { downloadAudio, cleanup } from '../lib/ytdlp.js';

export default {
    command: 'song',
    aliases: ['music', 'audio', 'mp3'],
    category: 'music',
    description: 'Download song from YouTube (MP3)',
    usage: '.song <song name | youtube link>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args.join(' ').trim();
        if (!query)
            return sock.sendMessage(chatId, { text: '🎵 *Song Downloader*\n\nUsage:\n.song <song name | YouTube link>' }, { quoted: message });
        let audioPath;
        try {
            let video;
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                video = { url: query, title: query };
            }
            else {
                const { videos } = await yts(query);
                if (!videos?.length)
                    return sock.sendMessage(chatId, { text: '❌ No results found.' }, { quoted: message });
                video = videos[0];
            }
            if (video.thumbnail) {
                await sock.sendMessage(chatId, {
                    image: { url: video.thumbnail },
                    caption: `🎶 *${video.title || query}*\n⏱ ${video.timestamp || ''}\n\n⏳ Downloading... *(may take up to a minute)*`
                }, { quoted: message });
            }
            audioPath = await downloadAudio(video.url);
            await sock.sendMessage(chatId, {
                audio: { url: audioPath },
                mimetype: 'audio/mpeg',
                fileName: `${video.title || 'song'}.mp3`,
                ptt: false
            }, { quoted: message });
        }
        catch (err) {
            console.error('Song plugin error:', err.message);
            await sock.sendMessage(chatId, { text: `❌ Failed: ${err.message}` }, { quoted: message });
        }
        finally {
            cleanup(audioPath);
        }
    }
};
