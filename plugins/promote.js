import t from '../lib/i18n.js';
async function handlePromotionEvent(sock, groupId, participants, author) {
    try {
        if (!Array.isArray(participants) || participants.length === 0) {
            return;
        }
        const promotedUsernames = await Promise.all(participants.map(async (jid) => {
            const jidString = typeof jid === 'string' ? jid : (jid.id || jid.toString());
            return `@${jidString.split('@')[0]} `;
        }));
        let promotedBy;
        const mentionList = participants.map(jid => {
            return typeof jid === 'string' ? jid : (jid.id || jid.toString());
        });
        if (author && author.length > 0) {
            const authorJid = typeof author === 'string' ? author : (author.id || author.toString());
            promotedBy = `@${authorJid.split('@')[0]}`;
            mentionList.push(authorJid);
        }
        else {
            promotedBy = t('promote.system');
        }
        const promotionMessage = `${t('promote.title')}\n\n` +
            `👥 *${t('promote.promotedUsers', { plural: participants.length > 1 ? 's' : '' })}:*\n` +
            `${promotedUsernames.map(name => `• ${name}`).join('\n')}\n\n` +
            `👑 *${t('promote.promotedBy')}:* ${promotedBy}\n\n` +
            `📅 *${t('promote.date')}:* ${new Date().toLocaleString()}`;
        await sock.sendMessage(groupId, {
            text: promotionMessage,
            mentions: mentionList
        });
    }
    catch (error) {
        console.error('Error handling promotion event:', error);
    }
}
export default {
    command: 'promote',
    aliases: ['admin'],
    category: 'admin',
    description: 'Promote user(s) to admin',
    usage: '.promote [@user] or reply to message',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        let userToPromote = [];
        const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentionedJids && mentionedJids.length > 0) {
            userToPromote = mentionedJids;
        }
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToPromote = [message.message.extendedTextMessage.contextInfo.participant];
        }
        if (userToPromote.length === 0) {
            await sock.sendMessage(chatId, {
                text: t('promote.usage'),
                ...channelInfo
            }, { quoted: message });
            return;
        }
        try {
            await sock.groupParticipantsUpdate(chatId, userToPromote, "promote");
            const usernames = await Promise.all(userToPromote.map(async (jid) => {
                return `@${jid.split('@')[0]}`;
            }));
            const promoterJid = sock.user.id;
            const promotionMessage = `${t('promote.title')}\n\n` +
                `👥 *${t('promote.promotedUsers', { plural: userToPromote.length > 1 ? 's' : '' })}:*\n` +
                `${usernames.map(name => `• ${name}`).join('\n')}\n\n` +
                `👑 *${t('promote.promotedBy')}:* @${promoterJid.split('@')[0]}\n\n` +
                `📅 *${t('promote.date')}:* ${new Date().toLocaleString()}`;
            await sock.sendMessage(chatId, {
                text: promotionMessage,
                mentions: [...userToPromote, promoterJid],
                ...channelInfo
            });
        }
        catch (error) {
            console.error('Error in promote command:', error);
            await sock.sendMessage(chatId, {
                text: t('promote.failed'),
                ...channelInfo
            }, { quoted: message });
        }
    },
    handlePromotionEvent
};
