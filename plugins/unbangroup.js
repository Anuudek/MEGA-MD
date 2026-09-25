import t from '../lib/i18n.js';
import { getBannedGroups, saveBannedGroups } from './bangroup.js';

export default {
    command: 'unbangroup',
    aliases: ['unbanthisgroup'],
    category: 'owner',
    description: 'Remove o banimento do grupo atual (ou um ID informado)',
    usage: '.unbangroup [id do grupo]',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const alvo = args[0] && args[0].includes('@g.us') ? args[0] : chatId;
        try {
            const bannedGroups = await getBannedGroups();
            const index = bannedGroups.indexOf(alvo);
            if (index === -1) {
                await sock.sendMessage(chatId, { text: t('bangroup.naoEstaBanido') }, { quoted: message });
                return;
            }
            bannedGroups.splice(index, 1);
            await saveBannedGroups(bannedGroups);
            await sock.sendMessage(chatId, { text: t('bangroup.desbanidoSucesso') }, { quoted: message });
        }
        catch (error) {
            console.error('Error in unbangroup command:', error);
            await sock.sendMessage(chatId, { text: t('bangroup.falhou') }, { quoted: message });
        }
    }
};
