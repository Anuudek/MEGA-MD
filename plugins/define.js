import axios from 'axios';
import t from '../lib/i18n.js';
export default {
    command: 'define',
    aliases: ['dict', 'urban'],
    category: 'search',
    description: 'Search a word on Dictionary',
    usage: '.define <word>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args?.join(' ')?.trim();
        if (!query) {
            return await sock.sendMessage(chatId, { text: t('define.usage') }, { quoted: message });
        }
        try {
            const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(query)}`;
            const { data: json } = await axios.get(url);
            if (!json?.list || json.list.length === 0) {
                return await sock.sendMessage(chatId, { text: t('define.notFound') }, { quoted: message });
            }
            const firstEntry = json.list[0];
            const definition = firstEntry.definition || t('define.noDefinition');
            const example = firstEntry.example ? `*${t('define.exampleLabel')}:* ${firstEntry.example}` : '';
            const text = `${t('define.title')}\n\n*${t('define.word')}:* ${query}\n*${t('define.definitionLabel')}:* ${definition}\n${example}`;
            await sock.sendMessage(chatId, { text }, { quoted: message });
        }
        catch (error) {
            console.error('Urban plugin error:', error);
            await sock.sendMessage(chatId, { text: t('define.error') }, { quoted: message });
        }
    }
};
