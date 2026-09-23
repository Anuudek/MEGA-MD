import t from '../lib/i18n.js';
export default {
    command: 'meme',
    aliases: ['cheems', 'memes'],
    category: 'fun',
    description: 'Get a random cheems meme with buttons for another meme or joke',
    usage: '.meme',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const res = await fetch('https://shizoapi.onrender.com/api/memes/cheems?apikey=shizo');
            if (!res.ok)
                throw new Error(`API request failed with status ${res.status}`);
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('image')) {
                const imageBuffer = Buffer.from(await res.arrayBuffer());
                const buttons = [
                    { buttonId: '.meme', buttonText: { displayText: t('meme.anotherMeme') }, type: 1 },
                    { buttonId: '.joke', buttonText: { displayText: t('meme.jokeButton') }, type: 1 }
                ];
                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: t('meme.caption'),
                    buttons,
                    headerType: 1
                }, { quoted: message });
            }
            else {
                await sock.sendMessage(chatId, {
                    text: t('meme.invalidImage'),
                    quoted: message
                });
            }
        }
        catch (error) {
            console.error('Meme Command Error:', error);
            await sock.sendMessage(chatId, {
                text: t('meme.error'),
                quoted: message
            });
        }
    }
};
