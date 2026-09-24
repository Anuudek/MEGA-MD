import fs from 'fs';
import path from 'path';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { writeFile } from 'fs/promises';
import store from '../lib/lightweight_store.js';
import t from '../lib/i18n.js';
const messageStore = new Map();
const TEMP_MEDIA_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_MEDIA_DIR)) {
    fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });
}
async function getGroupAntideleteConfig(chatId) {
    const settings = await store.getSetting(chatId, 'groupAntidelete');
    return settings || { enabled: false };
}
async function setGroupAntideleteConfig(chatId, config) {
    await store.saveSetting(chatId, 'groupAntidelete', config);
}
async function downloadToTemp(mediaMessage, mediaType, fileName) {
    const stream = await downloadContentFromMessage(mediaMessage, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    const mediaPath = path.join(TEMP_MEDIA_DIR, fileName);
    await writeFile(mediaPath, buffer);
    return mediaPath;
}
export async function storeGroupMessage(sock, message) {
    try {
        const chatId = message.key.remoteJid;
        if (!chatId?.endsWith('@g.us'))
            return;
        const config = await getGroupAntideleteConfig(chatId);
        if (!config.enabled)
            return;
        if (!message.key?.id)
            return;
        const messageId = message.key.id;
        let content = '';
        let mediaType = '';
        let mediaPath = '';
        let isViewOnce = false;
        const sender = message.key.participant || message.key.remoteJid;
        // View-once media shows up two different ways depending on the
        // sending client: wrapped in a viewOnceMessage(V2) container, or as
        // a regular imageMessage/videoMessage with a `viewOnce: true` flag
        // set directly on it (no wrapper at all).
        const viewOnceContainer = message.message?.viewOnceMessageV2Extension?.message || message.message?.viewOnceMessageV2?.message || message.message?.viewOnceMessage?.message;
        const directViewOnceImage = message.message?.imageMessage?.viewOnce ? message.message.imageMessage : null;
        const directViewOnceVideo = message.message?.videoMessage?.viewOnce ? message.message.videoMessage : null;
        if (viewOnceContainer?.imageMessage || directViewOnceImage) {
            const img = viewOnceContainer?.imageMessage || directViewOnceImage;
            mediaType = 'image';
            content = img.caption || '';
            mediaPath = await downloadToTemp(img, 'image', `gad_${messageId}.jpg`);
            isViewOnce = true;
        }
        else if (viewOnceContainer?.videoMessage || directViewOnceVideo) {
            const vid = viewOnceContainer?.videoMessage || directViewOnceVideo;
            mediaType = 'video';
            content = vid.caption || '';
            mediaPath = await downloadToTemp(vid, 'video', `gad_${messageId}.mp4`);
            isViewOnce = true;
        }
        else if (message.message?.conversation) {
            content = message.message.conversation;
        }
        else if (message.message?.extendedTextMessage?.text) {
            content = message.message.extendedTextMessage.text;
        }
        else if (message.message?.imageMessage) {
            mediaType = 'image';
            content = message.message.imageMessage.caption || '';
            mediaPath = await downloadToTemp(message.message.imageMessage, 'image', `gad_${messageId}.jpg`);
        }
        else if (message.message?.stickerMessage) {
            mediaType = 'sticker';
            mediaPath = await downloadToTemp(message.message.stickerMessage, 'sticker', `gad_${messageId}.webp`);
        }
        else if (message.message?.videoMessage) {
            mediaType = 'video';
            content = message.message.videoMessage.caption || '';
            mediaPath = await downloadToTemp(message.message.videoMessage, 'video', `gad_${messageId}.mp4`);
        }
        else if (message.message?.audioMessage) {
            mediaType = 'audio';
            const mime = message.message.audioMessage.mimetype || '';
            const ext = mime.includes('mpeg') ? 'mp3' : (mime.includes('ogg') ? 'ogg' : 'mp3');
            mediaPath = await downloadToTemp(message.message.audioMessage, 'audio', `gad_${messageId}.${ext}`);
        }
        messageStore.set(messageId, {
            content,
            mediaType,
            mediaPath,
            sender,
            group: chatId,
            timestamp: new Date().toISOString()
        });
        if (isViewOnce && mediaType && fs.existsSync(mediaPath)) {
            try {
                const senderName = sender.split('@')[0];
                const mediaOptions = {
                    caption: t('groupantidelete.viewOnceCaption', { type: mediaType, user: senderName }),
                    mentions: [sender]
                };
                if (mediaType === 'image') {
                    await sock.sendMessage(chatId, { image: { url: mediaPath }, ...mediaOptions });
                }
                else if (mediaType === 'video') {
                    await sock.sendMessage(chatId, { video: { url: mediaPath }, ...mediaOptions });
                }
                try {
                    fs.unlinkSync(mediaPath);
                }
                catch { }
            }
            catch (e) { }
        }
    }
    catch (err) {
        console.error('storeGroupMessage error:', err);
    }
}
export async function handleGroupMessageRevocation(sock, revocationMessage) {
    try {
        const chatId = revocationMessage.key.remoteJid;
        if (!chatId?.endsWith('@g.us'))
            return;
        const config = await getGroupAntideleteConfig(chatId);
        if (!config.enabled)
            return;
        const messageId = revocationMessage.message.protocolMessage.key.id;
        const deletedBy = revocationMessage.participant || revocationMessage.key.participant || revocationMessage.key.remoteJid;
        const botId = `${sock.user.id.split(':')[0]}@s.whatsapp.net`;
        if (deletedBy.includes(sock.user.id) || deletedBy === botId)
            return;
        const original = messageStore.get(messageId);
        if (!original)
            return;
        const sender = original.sender;
        const senderName = sender.split('@')[0];
        const time = new Date().toLocaleString('pt-BR', {
            timeZone: process.env.TIMEZONE || 'America/Sao_Paulo',
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        let text = `${t('groupantidelete.reportTitle')}\n\n` +
            `*${t('groupantidelete.deletedBy')}:* @${deletedBy.split('@')[0]}\n` +
            `*${t('groupantidelete.sender')}:* @${senderName}\n` +
            `*${t('groupantidelete.time')}:* ${time}\n`;
        if (original.content) {
            text += `\n*${t('groupantidelete.deletedMessage')}:*\n${original.content}`;
        }
        await sock.sendMessage(chatId, {
            text,
            mentions: [deletedBy, sender]
        });
        if (original.mediaType && fs.existsSync(original.mediaPath)) {
            const mediaOptions = {
                caption: t('groupantidelete.deletedMediaCaption', { type: original.mediaType, user: senderName }),
                mentions: [sender]
            };
            try {
                switch (original.mediaType) {
                    case 'image':
                        await sock.sendMessage(chatId, { image: { url: original.mediaPath }, ...mediaOptions });
                        break;
                    case 'sticker':
                        await sock.sendMessage(chatId, { sticker: { url: original.mediaPath }, ...mediaOptions });
                        break;
                    case 'video':
                        await sock.sendMessage(chatId, { video: { url: original.mediaPath }, ...mediaOptions });
                        break;
                    case 'audio':
                        await sock.sendMessage(chatId, { audio: { url: original.mediaPath }, mimetype: 'audio/mpeg', ptt: false, ...mediaOptions });
                        break;
                }
            }
            catch (err) {
                await sock.sendMessage(chatId, { text: t('groupantidelete.mediaError', { message: err.message }) });
            }
            try {
                fs.unlinkSync(original.mediaPath);
            }
            catch (err) {
                console.error('Media cleanup error:', err);
            }
        }
        messageStore.delete(messageId);
    }
    catch (err) {
        console.error('handleGroupMessageRevocation error:', err);
    }
}
export default {
    command: 'groupantidelete',
    aliases: ['gad', 'gantidelete'],
    category: 'admin',
    description: 'Enable or disable antidelete for this specific group only, reposting deletions in the group',
    usage: '.groupantidelete <on|off>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const config = await getGroupAntideleteConfig(chatId);
        const action = args[0]?.toLowerCase();
        if (!action) {
            await sock.sendMessage(chatId, {
                text: `${t('groupantidelete.setupTitle')}\n\n` +
                    `*${t('groupantidelete.currentStatus')}:* ${config.enabled ? t('groupantidelete.enabled') : t('groupantidelete.disabled')}\n\n` +
                    `${t('groupantidelete.commandsTitle')}\n` +
                    `• \`.groupantidelete on\` - ${t('groupantidelete.enableDesc')}\n` +
                    `• \`.groupantidelete off\` - ${t('groupantidelete.disableDesc')}\n\n` +
                    `${t('groupantidelete.featuresTitle')}\n` +
                    `${t('groupantidelete.featureList')}`
            }, { quoted: message });
            return;
        }
        if (action === 'on') {
            config.enabled = true;
            await setGroupAntideleteConfig(chatId, config);
            await sock.sendMessage(chatId, {
                text: t('groupantidelete.enabledMsg')
            }, { quoted: message });
        }
        else if (action === 'off') {
            config.enabled = false;
            await setGroupAntideleteConfig(chatId, config);
            await sock.sendMessage(chatId, {
                text: t('groupantidelete.disabledMsg')
            }, { quoted: message });
        }
        else {
            await sock.sendMessage(chatId, {
                text: t('groupantidelete.invalidCommand')
            }, { quoted: message });
        }
    },
    storeGroupMessage,
    handleGroupMessageRevocation,
    getGroupAntideleteConfig,
    setGroupAntideleteConfig
};
