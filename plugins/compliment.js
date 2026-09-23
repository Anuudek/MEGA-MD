import t, { tList } from '../lib/i18n.js';
export default {
    command: 'compliment',
    aliases: ['praise', 'nice'],
    category: 'group',
    description: 'Send a random compliment to a user',
    usage: '.compliment @user',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            if (!message || !chatId) {
                console.log('Invalid message or chatId:', { message, chatId });
                return;
            }
            let userToCompliment;
            if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                userToCompliment =
                    message.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }
            else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
                userToCompliment =
                    message.message.extendedTextMessage.contextInfo.participant;
            }
            if (!userToCompliment) {
                await sock.sendMessage(chatId, {
                    text: t('compliment.usage')
                }, { quoted: message });
                return;
            }
            const compliments = tList('compliment.list');
            const compliment = compliments[Math.floor(Math.random() * compliments.length)];
            await new Promise(resolve => setTimeout(resolve, 1000));
            await sock.sendMessage(chatId, {
                text: t('compliment.greeting', { user: userToCompliment.split('@')[0], compliment }),
                mentions: [userToCompliment]
            }, { quoted: message });
        }
        catch (error) {
            console.error('Error in compliment command:', error);
            if (error?.data === 429) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                try {
                    await sock.sendMessage(chatId, {
                        text: t('compliment.rateLimited')
                    }, { quoted: message });
                }
                catch (retryError) {
                    console.error('Error sending retry message:', retryError);
                }
            }
            else {
                try {
                    await sock.sendMessage(chatId, {
                        text: t('compliment.error')
                    }, { quoted: message });
                }
                catch (sendError) {
                    console.error('Error sending error message:', sendError);
                }
            }
        }
    }
};
