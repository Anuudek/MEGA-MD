import axios from 'axios';
import t from '../lib/i18n.js';
export default {
    command: 'wyr',
    aliases: ['wouldyourather'],
    category: 'quotes',
    description: 'Get a Would You Rather question',
    usage: '.wyr',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const res = await axios.get('https://discardapi.dpdns.org/api/quote/wyr?apikey=guru');
            if (!res.data || res.data.status !== true) {
                return await sock.sendMessage(chatId, { text: t('wyr.fetchFailed') }, { quoted: message });
            }
            const opt1 = res.data.question?.option1 || 'Option 1 not found';
            const opt2 = res.data.question?.option2 || 'Option 2 not found';
            const _creator = res.data.creator || 'Unknown';
            const replyText = `${t('wyr.title')}\n\n◍ ${opt1}\n◍ ${opt2}`;
            await sock.sendMessage(chatId, { text: replyText }, { quoted: message });
        }
        catch (err) {
            console.error('WYR plugin error:', err);
            await sock.sendMessage(chatId, { text: t('wyr.error') }, { quoted: message });
        }
    }
};
