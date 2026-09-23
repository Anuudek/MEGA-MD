import t from '../lib/i18n.js';
export default {
    command: 'setgdesc',
    aliases: ['setdesc', 'groupdesc'],
    category: 'admin',
    description: 'Change group description',
    usage: '.setgdesc <new description>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const desc = args.join(' ').trim();
        if (!desc) {
            await sock.sendMessage(chatId, {
                text: t('setgdesc.usage')
            }, { quoted: message });
            return;
        }
        try {
            await sock.groupUpdateDescription(chatId, desc);
            await sock.sendMessage(chatId, {
                text: t('setgdesc.success')
            }, { quoted: message });
        }
        catch (error) {
            console.error('Error updating group description:', error);
            await sock.sendMessage(chatId, {
                text: t('setgdesc.failed')
            }, { quoted: message });
        }
    }
};
