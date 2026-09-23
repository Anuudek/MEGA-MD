import config from '../config.js';
/*****************************************************************************
 *                                                                           *
 *                     Developed By Qasim Ali                                *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/GlobalTechInfo                         *
 *  ▶️  YouTube  : https://youtube.com/@GlobalTechInfo                       *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029VagJIAr3bbVBCpEkAM07     *
 *                                                                           *
 *    © 2026 GlobalTechInfo. All rights reserved.                            *
 *                                                                           *
 *    Description: This file is part of the MEGA-MD Project.                 *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/
import commandHandler from '../lib/commandHandler.js';
import i18n from '../lib/i18n.js';
function formatTime() {
    const now = new Date();
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: config.timeZone || 'UTC'
    };
    return now.toLocaleTimeString('en-US', options);
}
const menuStyles = [
    {
        render({ _title, info, categories, prefix }) {
            let t = `╭━━『 *MEGA MENU* 』━⬣\n`;
            t += `┃ ✨ *${info.botLabel}: ${info.bot}*\n`;
            t += `┃ 🔧 *${info.prefixLabel}: ${info.prefix}*\n`;
            t += `┃ 📦 *${info.pluginsLabel}: ${info.total}*\n`;
            t += `┃ 💎 *${info.versionLabel}: ${info.version}*\n`;
            t += `┃ ⏰ *${info.timeLabel}: ${info.time}*\n`;
            for (const [cat, cmds] of categories) {
                t += `┃━━━ *${cat.toUpperCase()}* ━✦\n`;
                for (const c of cmds)
                    t += `┃ ➤ ${prefix}${c}\n`;
            }
            t += `╰━━━━━━━━━━━━━⬣`;
            return t;
        }
    },
    {
        render({ _title, info, categories, prefix }) {
            let t = `◈╭─❍「 *MEGA MENU* 」❍\n`;
            t += `◈├• 🌟 *${info.botLabel}: ${info.bot}*\n`;
            t += `◈├• ⚙️ *${info.prefixLabel}: ${info.prefix}*\n`;
            t += `◈├• 🍫 *${info.pluginsLabel}: ${info.total}*\n`;
            t += `◈├• 💎 *${info.versionLabel}: ${info.version}*\n`;
            t += `◈├• ⏰ *${info.timeLabel}: ${info.time}*\n`;
            for (const [cat, cmds] of categories) {
                t += `◈├─❍「 *${cat.toUpperCase()}* 」❍\n`;
                for (const c of cmds)
                    t += `◈├• ${prefix}${c}\n`;
            }
            t += `◈╰──★─☆──♪♪─❍`;
            return t;
        }
    },
    {
        render({ _title, info, categories, prefix }) {
            let t = `┏━━━━ *MEGA MENU* ━━━┓\n`;
            t += `┃• *${info.botLabel} : ${info.bot}*\n`;
            t += `┃• *${info.prefixLabel} : ${info.prefix}*\n`;
            t += `┃• *${info.pluginsLabel} : ${info.total}*\n`;
            t += `┃• *${info.versionLabel} : ${info.version}*\n`;
            t += `┃• *${info.timeLabel} : ${info.time}*\n`;
            for (const [cat, cmds] of categories) {
                t += `┃━━━━ *${cat.toUpperCase()}* ━━◆\n`;
                for (const c of cmds)
                    t += `┃ ▸ ${prefix}${c}\n`;
            }
            t += `┗━━━━━━━━━━━━━━━┛`;
            return t;
        }
    },
    {
        render({ _title, info, categories, prefix }) {
            let t = `✦═══ *MEGA MENU* ═══✦\n`;
            t += `║➩ *${info.botLabel}: ${info.bot}*\n`;
            t += `║➩ *${info.prefixLabel}: ${info.prefix}*\n`;
            t += `║➩ *${info.pluginsLabel}: ${info.total}*\n`;
            t += `║➩ *${info.versionLabel}: ${info.version}*\n`;
            t += `║➩ *${info.timeLabel}: ${info.time}*\n`;
            for (const [cat, cmds] of categories) {
                t += `║══ *${cat.toUpperCase()}* ══✧\n`;
                for (const c of cmds)
                    t += `║ ✦ ${prefix}${c}\n`;
            }
            t += `✦══════════════✦`;
            return t;
        }
    },
    {
        render({ _title, info, categories, prefix }) {
            let t = `❀━━━ *MEGA MENU* ━━━❀\n`;
            t += `┃☞ *${info.botLabel}: ${info.bot}*\n`;
            t += `┃☞ *${info.prefixLabel}: ${info.prefix}*\n`;
            t += `┃☞ *${info.pluginsLabel}: ${info.total}*\n`;
            t += `┃☞ *${info.versionLabel}: ${info.version}*\n`;
            t += `┃☞ *${info.timeLabel}: ${info.time}*\n`;
            for (const [cat, cmds] of categories) {
                t += `┃━━━〔 *${cat.toUpperCase()}* 〕━❀\n`;
                for (const c of cmds)
                    t += `┃☞ ${prefix}${c}\n`;
            }
            t += `❀━━━━━━━━━━━━━━❀`;
            return t;
        }
    },
    {
        render({ _title, info, categories, prefix }) {
            let t = `◆━━━ *MEGA MENU* ━━━◆\n`;
            t += `┃ ¤ *${info.botLabel}: ${info.bot}*\n`;
            t += `┃ ¤ *${info.prefixLabel}: ${info.prefix}*\n`;
            t += `┃ ¤ *${info.pluginsLabel}: ${info.total}*\n`;
            t += `┃ ¤ *${info.versionLabel}: ${info.version}*\n`;
            t += `┃ ¤ *${info.timeLabel}: ${info.time}*\n`;
            for (const [cat, cmds] of categories) {
                t += `┃━━ *${cat.toUpperCase()}* ━━◆◆\n`;
                for (const c of cmds)
                    t += `┃ ¤ ${prefix}${c}\n`;
            }
            t += `◆━━━━━━━━━━━━━━━━◆`;
            return t;
        }
    },
    {
        render({ _title, info, categories, prefix }) {
            let t = `╭───⬣ *MEGA MENU* ──⬣\n`;
            t += ` | ● *${info.botLabel}: ${info.bot}*\n`;
            t += ` | ● *${info.prefixLabel}: ${info.prefix}*\n`;
            t += ` | ● *${info.pluginsLabel}: ${info.total}*\n`;
            t += ` | ● *${info.versionLabel}: ${info.version}*\n`;
            t += ` | ● *${info.timeLabel}: ${info.time}*\n`;
            for (const [cat, cmds] of categories) {
                t += ` |───⬣ *${cat.toUpperCase()}* ──⬣\n`;
                for (const c of cmds)
                    t += ` | ● ${prefix}${c}\n`;
            }
            t += `╰──────────⬣`;
            return t;
        }
    }
];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export default {
    command: 'menu',
    aliases: ['help', 'commands', 'h', 'list'],
    category: 'general',
    description: 'Show all commands',
    usage: '.menu [command]',
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const prefix = config.prefixes[0];
        if (args.length) {
            const searchTerm = args[0].toLowerCase();
            let cmd = commandHandler.commands.get(searchTerm);
            if (!cmd && commandHandler.aliases.has(searchTerm)) {
                const mainCommand = commandHandler.aliases.get(searchTerm);
                cmd = commandHandler.commands.get(mainCommand);
            }
            if (!cmd) {
                return sock.sendMessage(chatId, {
                    text: i18n('list.notFound', { cmd: args[0], prefix }),
                    ...channelInfo
                }, { quoted: message });
            }
            const text = `╭━━━━━━━━━━━━━━⬣
┃ 📌 *${i18n('list.infoTitle')}*
┃
┃ ⚡ *${i18n('list.command')}:* ${prefix}${cmd.command}
┃ 📝 *${i18n('list.desc')}:* ${cmd.description || i18n('list.noDescription')}
┃ 📖 *${i18n('list.usage')}:* ${cmd.usage || `${prefix}${cmd.command}`}
┃ 🏷️ *${i18n('list.category')}:* ${cmd.category || 'misc'}
┃ 🔖 *${i18n('list.aliases')}:* ${cmd.aliases?.length ? cmd.aliases.map((a) => prefix + a).join(', ') : i18n('list.none')}
┃
╰━━━━━━━━━━━━━━⬣`;
            return sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });
        }
        const style = pick(menuStyles);
        const text = style.render({
            title: config.botName,
            prefix,
            info: {
                bot: config.botName,
                prefix: config.prefixes.join(', '),
                total: commandHandler.commands.size,
                version: config.version || "6.0.0",
                time: formatTime(),
                botLabel: i18n('list.bot'),
                prefixLabel: i18n('list.prefix'),
                pluginsLabel: i18n('list.plugins'),
                versionLabel: i18n('list.version'),
                timeLabel: i18n('list.time')
            },
            categories: commandHandler.categories
        });
        await sock.sendMessage(chatId, { text, ...channelInfo }, { quoted: message });
    }
};
/*****************************************************************************
 *                                                                           *
 *                     Developed By Qasim Ali                                *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/GlobalTechInfo                         *
 *  ▶️  YouTube  : https://youtube.com/@GlobalTechInfo                       *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029VagJIAr3bbVBCpEkAM07     *
 *                                                                           *
 *    © 2026 GlobalTechInfo. All rights reserved.                            *
 *                                                                           *
 *    Description: This file is part of the MEGA-MD Project.                 *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/
