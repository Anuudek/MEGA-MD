import store from '../lib/lightweight_store.js';
import t from '../lib/i18n.js';
async function getAntibadwordSettings(chatId) {
    const settings = await store.getSetting(chatId, 'antibadword');
    return settings || { enabled: false, words: [] };
}
async function saveAntibadwordSettings(chatId, settings) {
    await store.saveSetting(chatId, 'antibadword', settings);
}
async function handleAntiBadwordCommand(sock, chatId, message, match) {
    const args = match.trim().toLowerCase().split(/\s+/);
    const action = args[0];
    const settings = await getAntibadwordSettings(chatId);
    if (!action || action === 'status') {
        const status = settings.enabled ? t('antibadword.enabled') : t('antibadword.disabled');
        const wordCount = settings.words?.length || 0;
        await sock.sendMessage(chatId, {
            text: `${t('antibadword.statusTitle')}\n\n` +
                `${t('antibadword.status')}: ${status}\n` +
                `${t('antibadword.blockedWords')}: ${wordCount}\n\n` +
                `${t('antibadword.usageTitle')}\n` +
                `• ${t('antibadword.cmdOn')}\n` +
                `• ${t('antibadword.cmdOff')}\n` +
                `• ${t('antibadword.cmdAdd')}\n` +
                `• ${t('antibadword.cmdRemove')}\n` +
                `• ${t('antibadword.cmdList')}`
        }, { quoted: message });
        return;
    }
    if (action === 'on') {
        settings.enabled = true;
        await saveAntibadwordSettings(chatId, settings);
        await sock.sendMessage(chatId, {
            text: t('antibadword.enabledMsg')
        }, { quoted: message });
        return;
    }
    if (action === 'off') {
        settings.enabled = false;
        await saveAntibadwordSettings(chatId, settings);
        await sock.sendMessage(chatId, {
            text: t('antibadword.disabledMsg')
        }, { quoted: message });
        return;
    }
    if (action === 'add') {
        const word = args.slice(1).join(' ').toLowerCase().trim();
        if (!word) {
            await sock.sendMessage(chatId, {
                text: t('antibadword.specifyAdd')
            }, { quoted: message });
            return;
        }
        if (!settings.words)
            settings.words = [];
        if (settings.words.includes(word)) {
            await sock.sendMessage(chatId, {
                text: t('antibadword.alreadyInList', { word })
            }, { quoted: message });
            return;
        }
        settings.words.push(word);
        await saveAntibadwordSettings(chatId, settings);
        await sock.sendMessage(chatId, {
            text: t('antibadword.wordAdded', { word, count: settings.words.length })
        }, { quoted: message });
        return;
    }
    if (action === 'remove' || action === 'delete' || action === 'del') {
        const word = args.slice(1).join(' ').toLowerCase().trim();
        if (!word) {
            await sock.sendMessage(chatId, {
                text: t('antibadword.specifyRemove')
            }, { quoted: message });
            return;
        }
        if (!settings.words || !settings.words.includes(word)) {
            await sock.sendMessage(chatId, {
                text: t('antibadword.notInList', { word })
            }, { quoted: message });
            return;
        }
        settings.words = settings.words.filter((w) => w !== word);
        await saveAntibadwordSettings(chatId, settings);
        await sock.sendMessage(chatId, {
            text: t('antibadword.wordRemoved', { word, count: settings.words.length })
        }, { quoted: message });
        return;
    }
    if (action === 'list') {
        if (!settings.words || settings.words.length === 0) {
            await sock.sendMessage(chatId, {
                text: `${t('antibadword.emptyListTitle')}\n\n${t('antibadword.emptyList')}`
            }, { quoted: message });
            return;
        }
        const wordList = settings.words.map((w, i) => `${i + 1}. ${w}`).join('\n');
        await sock.sendMessage(chatId, {
            text: `${t('antibadword.listTitle')}\n\n${wordList}\n\n${t('antibadword.total')}: ${settings.words.length} ${t('antibadword.words')}`
        }, { quoted: message });
        return;
    }
    await sock.sendMessage(chatId, {
        text: t('antibadword.invalidAction')
    }, { quoted: message });
}
async function checkAntiBadword(sock, message) {
    const chatId = message.key.remoteJid;
    if (!chatId.endsWith('@g.us'))
        return false;
    const settings = await getAntibadwordSettings(chatId);
    if (!settings.enabled || !settings.words || settings.words.length === 0)
        return false;
    const messageText = (message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption ||
        message.message?.videoMessage?.caption ||
        '').toLowerCase();
    if (!messageText)
        return false;
    for (const word of settings.words) {
        if (messageText.includes(word.toLowerCase())) {
            try {
                await sock.sendMessage(chatId, { delete: message.key });
                await sock.sendMessage(chatId, {
                    text: t('antibadword.deletedMsg', { word })
                });
                return true;
            }
            catch (error) {
                console.error('Error deleting badword message:', error);
            }
            break;
        }
    }
    return false;
}
export default {
    command: 'antibadword',
    aliases: ['abw', 'badword', 'antibad'],
    category: 'admin',
    description: 'Configure anti-badword filter to delete messages containing inappropriate words',
    usage: '.antibadword <on|off|add|remove|list>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const match = args.join(' ');
        try {
            await handleAntiBadwordCommand(sock, chatId, message, match);
        }
        catch (error) {
            console.error('Error in antibadword command:', error);
            await sock.sendMessage(chatId, {
                text: t('antibadword.genericError')
            }, { quoted: message });
        }
    }
};
export { handleAntiBadwordCommand };
export { checkAntiBadword };
