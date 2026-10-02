import yts from 'yt-search';
import { downloadVideo, cleanup } from '../lib/ytdlp.js';

export default {
    command: 'video',
    aliases: ['ytmp4', 'ytvideo', 'ytdl'],
    category: 'download',
    description: 'Download YouTube videos by link or search',
    usage: '.video <youtube link | search query>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args.join(' ').trim();
        if (!query)
            return sock.sendMessage(chatId, { text: '🎥 *What video do you want to download?*\nExample:\n.video Alan Walker Faded' }, { quoted: message });
        let videoPath;
        try {
            let videoUrl;
            let videoTitle;
            let videoThumbnail;
            if (query.startsWith('http://') || query.startsWith('https://')) {
                videoUrl = query;
            }
            else {
                const { videos } = await yts(query);
                if (!videos?.length)
                    return sock.sendMessage(chatId, { text: '❌ No videos found!' }, { quoted: message });
                videoUrl = videos[0].url;
                videoTitle = videos[0].title;
                videoThumbnail = videos[0].thumbnail;
            }
            const validYT = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/);
            if (!validYT)
                return sock.sendMessage(chatId, { text: '❌ Not a valid YouTube link!' }, { quoted: message });
            const ytId = validYT[1];
            const thumb = videoThumbnail || `https://i.ytimg.com/vi/${ytId}/sddefault.jpg`;
            await sock.sendMessage(chatId, {
                image: { url: thumb },
                caption: `🎬 *${videoTitle || query}*\n⬇️ Downloading... *(may take up to a minute)*`
            }, { quoted: message });
            videoPath = await downloadVideo(videoUrl);
            await sock.sendMessage(chatId, {
                video: { url: videoPath },
                mimetype: 'video/mp4',
                fileName: `${videoTitle || 'video'}.mp4`,
                caption: `🎬 *${videoTitle || 'Video'}*`
            }, { quoted: message });
        }
        catch (err) {
            console.error('[VIDEO] Error:', err.message);
            await sock.sendMessage(chatId, { text: `❌ Download failed!\nReason: ${err.message}` }, { quoted: message });
        }
        finally {
            cleanup(videoPath);
        }
    }
};
