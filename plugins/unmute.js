import t from '../lib/i18n.js';
export default {
    command: 'unmute',
    aliases: ['unsilence'],
    category: 'admin',
    description: 'Unmute the group',
    usage: '.unmute',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        try {
            await sock.groupSettingUpdate(chatId, 'not_announcement');
            await sock.sendMessage(chatId, {
                text: t('unmute.unmuted'),
                ...channelInfo
            }, { quoted: message });
        }
        catch (error) {
            console.error('Error unmuting group:', error);
            await sock.sendMessage(chatId, {
                text: t('unmute.error'),
                ...channelInfo
            }, { quoted: message });
        }
    }
};
