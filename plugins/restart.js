import { restartProcess } from './update.js';

export default {
    command: 'restart',
    aliases: ['reboot'],
    category: 'owner',
    description: 'Restart the bot process (no update, no git pull)',
    usage: '.restart',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        await sock.sendMessage(chatId, {
            text: '♻️ Restarting bot...',
            ...channelInfo
        }, { quoted: message });
        await new Promise(resolve => setTimeout(resolve, 800));
        await restartProcess();
    }
};
