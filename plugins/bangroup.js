import fs from 'fs';
import store from '../lib/lightweight_store.js';
import t from '../lib/i18n.js';

const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB = !!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);
const bannedGroupsFilePath = './data/bannedGroups.json';

export async function getBannedGroups() {
    if (HAS_DB) {
        const banned = await store.getSetting('global', 'bannedGroups');
        return banned || [];
    }
    else {
        if (fs.existsSync(bannedGroupsFilePath)) {
            return JSON.parse(fs.readFileSync(bannedGroupsFilePath, 'utf-8'));
        }
        return [];
    }
}

export async function saveBannedGroups(bannedGroups) {
    if (HAS_DB) {
        await store.saveSetting('global', 'bannedGroups', bannedGroups);
    }
    else {
        if (!fs.existsSync('./data')) {
            fs.mkdirSync('./data', { recursive: true });
        }
        fs.writeFileSync(bannedGroupsFilePath, JSON.stringify(bannedGroups, null, 2));
    }
}

export async function isGroupBanned(chatId) {
    const bannedGroups = await getBannedGroups();
    return bannedGroups.includes(chatId);
}

export default {
    command: 'bangroup',
    aliases: ['banthisgroup'],
    category: 'owner',
    description: 'Bane o grupo atual (ou um ID informado) de usar o bot',
    usage: '.bangroup [id do grupo]',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const alvo = args[0] && args[0].includes('@g.us') ? args[0] : chatId;
        if (!alvo.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: t('bangroup.naoEhGrupo') }, { quoted: message });
            return;
        }
        try {
            const bannedGroups = await getBannedGroups();
            if (bannedGroups.includes(alvo)) {
                await sock.sendMessage(chatId, { text: t('bangroup.jaBanido') }, { quoted: message });
                return;
            }
            bannedGroups.push(alvo);
            await saveBannedGroups(bannedGroups);
            if (alvo !== chatId) {
                await sock.sendMessage(chatId, { text: t('bangroup.banidoSucesso') }, { quoted: message });
            }
            else {
                await sock.sendMessage(chatId, { text: t('bangroup.banidoEsteGrupo') });
            }
        }
        catch (error) {
            console.error('Error in bangroup command:', error);
            await sock.sendMessage(chatId, { text: t('bangroup.falhou') }, { quoted: message });
        }
    },
    isGroupBanned,
    getBannedGroups,
    saveBannedGroups
};
