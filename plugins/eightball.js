import t, { tList } from '../lib/i18n.js';
export default {
    command: '8ball',
    aliases: ['eightball', 'magic8ball'],
    category: 'fun',
    description: 'Ask the magic 8-ball a question',
    usage: '.8ball Will I be rich?',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const question = args.join(' ');
            if (!question) {
                await sock.sendMessage(chatId, {
                    text: t('eightball.askQuestion')
                }, { quoted: message });
                return;
            }
            const eightBallResponses = tList('eightball.responses');
            const randomResponse = eightBallResponses[Math.floor(Math.random() * eightBallResponses.length)];
            await sock.sendMessage(chatId, {
                text: `🎱 *${t('eightball.questionLabel')}:* ${question}\n\n*${t('eightball.answerLabel')}:* ${randomResponse}`
            }, { quoted: message });
        }
        catch (error) {
            console.error('Error in 8ball command:', error);
            await sock.sendMessage(chatId, {
                text: t('eightball.error')
            }, { quoted: message });
        }
    }
};
