import t, { tList } from '../lib/i18n.js';
export default {
    command: 'insult',
    aliases: ['roast', 'mock'],
    category: 'group',
    description: 'Send a playful insult to someone by mentioning them or replying to their message',
    usage: '.insult @username or reply to their message with .insult',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            let userToInsult;
            if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                userToInsult = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }
            else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
                userToInsult = message.message.extendedTextMessage.contextInfo.participant;
            }
            if (!userToInsult) {
                await sock.sendMessage(chatId, {
                    text: t('insult.usage'),
                    quoted: message
                });
                return;
            }
            const insults = tList('insult.list');
            const insult = insults[Math.floor(Math.random() * insults.length)];
            await new Promise(resolve => setTimeout(resolve, 1000));
            await sock.sendMessage(chatId, {
                text: t('insult.greeting', { user: userToInsult.split('@')[0], insult }),
                mentions: [userToInsult],
                quoted: message
            });
        }
        catch (error) {
            console.error('Error in insult command:', error);
            if (error.data === 429) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                try {
                    await sock.sendMessage(chatId, {
                        text: t('insult.rateLimited'),
                        quoted: message
                    });
                }
                catch (retryError) {
                    console.error('Error sending retry message:', retryError);
                }
            }
            else {
                try {
                    await sock.sendMessage(chatId, {
                        text: t('insult.error'),
                        quoted: message
                    });
                }
                catch (sendError) {
                    console.error('Error sending error message:', sendError);
                }
            }
        }
    }
};
