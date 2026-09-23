import axios from 'axios';
import t from '../lib/i18n.js';
export default { command: 'fact', aliases: ['randomfact', 'uselessfact'], category: 'fun', description: 'Get a random interesting fact', usage: '.fact', async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const r = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
            await sock.sendMessage(chatId, { text: r.data.text }, { quoted: message });
        }
        catch (e) {
            console.error('Error fetching fact:', e);
            await sock.sendMessage(chatId, { text: t('fact.fetchError') }, { quoted: message });
        }
    } };
