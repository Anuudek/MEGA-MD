import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import t from '../lib/i18n.js';

async function baixarBuffer(mediaMessage, tipo) {
    const stream = await downloadContentFromMessage(mediaMessage, tipo);
    let buffer = Buffer.from([]);
    for await (const chunk of stream)
        buffer = Buffer.concat([buffer, chunk]);
    return buffer;
}

export default {
    command: 'viewonce',
    aliases: ['viewmedia', 'vv', 'revive'],
    category: 'general',
    description: 'Reenvia uma foto/video de visualizacao unica (responda a mensagem)',
    usage: '.viewonce (respondendo a uma midia de visualizacao unica)',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) {
                await sock.sendMessage(chatId, { text: t('viewonce.semResposta') }, { quoted: message });
                return;
            }
            // Same two shapes we've seen in the wild: wrapped in a viewOnceMessage(V2/V2Extension)
            // container, or a plain imageMessage/videoMessage with `viewOnce: true` on it directly.
            const container = quoted.viewOnceMessageV2Extension?.message || quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message;
            const imagem = container?.imageMessage || (quoted.imageMessage?.viewOnce ? quoted.imageMessage : null);
            const video = container?.videoMessage || (quoted.videoMessage?.viewOnce ? quoted.videoMessage : null);

            if (imagem) {
                const buffer = await baixarBuffer(imagem, 'image');
                await sock.sendMessage(chatId, {
                    image: buffer,
                    fileName: 'media.jpg',
                    caption: imagem.caption || ''
                }, { quoted: message });
            }
            else if (video) {
                const buffer = await baixarBuffer(video, 'video');
                await sock.sendMessage(chatId, {
                    video: buffer,
                    fileName: 'media.mp4',
                    caption: video.caption || ''
                }, { quoted: message });
            }
            else {
                await sock.sendMessage(chatId, { text: t('viewonce.naoEhVisuUnica') }, { quoted: message });
            }
        }
        catch (error) {
            console.error('Error in viewonceCommand:', error);
            await sock.sendMessage(chatId, { text: t('viewonce.erro') }, { quoted: message });
        }
    }
};
