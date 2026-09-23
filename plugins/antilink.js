import store from '../lib/lightweight_store.js';
import isOwnerOrSudo from '../lib/isOwner.js';
import isAdmin from '../lib/isAdmin.js';
import t from '../lib/i18n.js';
async function setAntilink(chatId, type, action) {
    try {
        await store.saveSetting(chatId, 'antilink', {
            enabled: true,
            action,
            type
        });
        return true;
    }
    catch (error) {
        console.error('Error setting antilink:', error);
        return false;
    }
}
async function getAntilink(chatId, _type) {
    try {
        const settings = await store.getSetting(chatId, 'antilink');
        return settings || null;
    }
    catch (error) {
        console.error('Error getting antilink:', error);
        return null;
    }
}
async function removeAntilink(chatId, _type) {
    try {
        await store.saveSetting(chatId, 'antilink', {
            enabled: false,
            action: null,
            type: null
        });
        return true;
    }
    catch (error) {
        console.error('Error removing antilink:', error);
        return false;
    }
}
export async function handleLinkDetection(sock, chatId, message, userMessage, senderId) {
    try {
        const config = await getAntilink(chatId, 'on');
        if (!config?.enabled)
            return;
        // Check if sender is owner or sudo
        const isOwnerSudo = await isOwnerOrSudo(senderId, sock, chatId);
        if (isOwnerSudo)
            return;
        // Check if sender is admin
        try {
            const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
            if (isSenderAdmin)
                return;
        }
        catch (e) { }
        const action = config.action || 'delete';
        let shouldAct = false;
        let linkType = '';
        const linkPatterns = {
            whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i,
            whatsappChannel: /wa\.me\/channel\/[A-Za-z0-9]{20,}/i,
            telegram: /t\.me\/[A-Za-z0-9_]+/i,
            allLinks: /https?:\/\/\S+|www\.\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i,
        };
        if (linkPatterns.whatsappGroup.test(userMessage)) {
            shouldAct = true;
            linkType = t('antilink.linkTypeWhatsappGroup');
        }
        else if (linkPatterns.whatsappChannel.test(userMessage)) {
            shouldAct = true;
            linkType = t('antilink.linkTypeWhatsappChannel');
        }
        else if (linkPatterns.telegram.test(userMessage)) {
            shouldAct = true;
            linkType = t('antilink.linkTypeTelegram');
        }
        else if (linkPatterns.allLinks.test(userMessage)) {
            shouldAct = true;
            linkType = t('antilink.linkTypeGeneric');
        }
        if (!shouldAct)
            return;
        const messageId = message.key.id;
        const participant = message.key.participant || senderId;
        if (action === 'delete' || action === 'kick') {
            try {
                await sock.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        fromMe: false,
                        id: messageId,
                        participant
                    }
                });
            }
            catch (error) {
                console.error('Failed to delete message:', error);
            }
        }
        if (action === 'warn' || action === 'delete') {
            await sock.sendMessage(chatId, {
                text: t('antilink.warningMsg', { user: senderId.split('@')[0], linkType }),
                mentions: [senderId]
            });
        }
        if (action === 'kick') {
            try {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                await sock.sendMessage(chatId, {
                    text: t('antilink.kickedMsg', { user: senderId.split('@')[0], linkType }),
                    mentions: [senderId]
                });
            }
            catch (error) {
                console.error('Failed to kick user:', error);
                await sock.sendMessage(chatId, {
                    text: t('antilink.kickFailed')
                });
            }
        }
    }
    catch (error) {
        console.error('Error in link detection:', error);
    }
}
export default {
    command: 'antilink',
    aliases: ['alink', 'linkblock'],
    category: 'admin',
    description: 'Prevent users from sending links in the group',
    usage: '.antilink <on|off|set>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const action = args[0]?.toLowerCase();
        if (!action) {
            const config = await getAntilink(chatId, 'on');
            await sock.sendMessage(chatId, {
                text: `${t('antilink.setupTitle')}\n\n` +
                    `*${t('antilink.currentStatus')}:* ${config?.enabled ? t('antilink.enabled') : t('antilink.disabled')}\n` +
                    `*${t('antilink.currentAction')}:* ${config?.action || t('antilink.notSet')}\n\n` +
                    `*${t('antilink.commands')}:*\n` +
                    `• ${t('antilink.cmdOn')}\n` +
                    `• ${t('antilink.cmdOff')}\n` +
                    `• ${t('antilink.cmdSetDelete')}\n` +
                    `• ${t('antilink.cmdSetKick')}\n` +
                    `• ${t('antilink.cmdSetWarn')}\n\n` +
                    `*${t('antilink.protectedLinks')}:*\n` +
                    `• ${t('antilink.whatsappGroups')}\n` +
                    `• ${t('antilink.whatsappChannels')}\n` +
                    `• ${t('antilink.telegram')}\n` +
                    `• ${t('antilink.otherLinks')}\n\n` +
                    t('antilink.exemptNote')
            }, { quoted: message });
            return;
        }
        switch (action) {
            case 'on':
                const existingConfig = await getAntilink(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, {
                        text: t('antilink.alreadyEnabled')
                    }, { quoted: message });
                    return;
                }
                const result = await setAntilink(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, {
                    text: result ? t('antilink.enabledSuccess') : t('antilink.enableFailed')
                }, { quoted: message });
                break;
            case 'off':
                await removeAntilink(chatId, 'on');
                await sock.sendMessage(chatId, {
                    text: t('antilink.disabledMsg')
                }, { quoted: message });
                break;
            case 'set':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: t('antilink.specifyAction')
                    }, { quoted: message });
                    return;
                }
                const setAction = args[1].toLowerCase();
                if (!['delete', 'kick', 'warn'].includes(setAction)) {
                    await sock.sendMessage(chatId, {
                        text: t('antilink.invalidAction')
                    }, { quoted: message });
                    return;
                }
                const setResult = await setAntilink(chatId, 'on', setAction);
                const actionDescriptions = {
                    delete: t('antilink.actionDeleteDesc'),
                    kick: t('antilink.actionKickDesc'),
                    warn: t('antilink.actionWarnDesc')
                };
                await sock.sendMessage(chatId, {
                    text: setResult
                        ? `${t('antilink.actionSet', { action: setAction })}\n\n${actionDescriptions[setAction]}\n\n${t('antilink.exemptNote')}`
                        : t('antilink.setFailed')
                }, { quoted: message });
                break;
            case 'status':
            case 'get':
                const status = await getAntilink(chatId, 'on');
                await sock.sendMessage(chatId, {
                    text: `${t('antilink.statusTitle')}\n\n` +
                        `*${t('antilink.status')}:* ${status?.enabled ? t('antilink.enabled') : t('antilink.disabled')}\n` +
                        `*${t('antilink.action')}:* ${status?.action || t('antilink.notSet')}\n\n` +
                        `*${t('antilink.whatHappens')}:*\n` +
                        `${status?.action === 'delete' ? t('antilink.deleteExplain') : ''}` +
                        `${status?.action === 'kick' ? t('antilink.kickExplain') : ''}` +
                        `${status?.action === 'warn' ? t('antilink.warnExplain') : ''}\n\n` +
                        t('antilink.exemptNote')
                }, { quoted: message });
                break;
            default:
                await sock.sendMessage(chatId, {
                    text: t('antilink.invalidCommand')
                }, { quoted: message });
        }
    },
    handleLinkDetection,
    setAntilink,
    getAntilink,
    removeAntilink
};
