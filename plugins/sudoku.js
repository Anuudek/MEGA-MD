import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import t from '../lib/i18n.js';
const execAsync = promisify(exec);
export default {
    command: 'sudoku',
    aliases: ['sudokugen', 'sudokusolve', 'sdk'],
    category: 'utility',
    description: 'Generate Sudoku puzzles or solve them',
    usage: '.sudoku generate [easy|medium|hard]\n.sudoku solve <81 digits, 0 for empty>',
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const scriptPath = path.join(process.cwd(), 'lib', 'sudoku.py');
        if (!args.length || args[0] === 'help') {
            return await sock.sendMessage(chatId, {
                text: `${t('sudoku.helpTitle')}\n\n` +
                    `${t('sudoku.generateTitle')}\n` +
                    `\`.sudoku generate easy\`\n` +
                    `\`.sudoku generate medium\`\n` +
                    `\`.sudoku generate hard\`\n\n` +
                    `${t('sudoku.solveTitle')}\n` +
                    `\`.sudoku solve 530070000600195000098000060800060003400803001700020006060000280000419005000080079\`\n\n` +
                    t('sudoku.solveHint'),
                ...channelInfo
            }, { quoted: message });
        }
        const subCmd = args[0].toLowerCase();
        if (subCmd === 'generate') {
            const difficulty = (args[1] || 'medium').toLowerCase();
            if (!['easy', 'medium', 'hard'].includes(difficulty)) {
                return await sock.sendMessage(chatId, {
                    text: t('sudoku.invalidDifficulty'),
                    ...channelInfo
                }, { quoted: message });
            }
            await sock.sendMessage(chatId, {
                text: t('sudoku.generating', { difficulty }),
                ...channelInfo
            }, { quoted: message });
            try {
                const { stdout } = await execAsync(`python3 "${scriptPath}" generate ${difficulty}`, { timeout: 30000 });
                const data = JSON.parse(stdout.trim());
                if (data.error) {
                    return await sock.sendMessage(chatId, {
                        text: `❌ ${data.error}`,
                        ...channelInfo
                    }, { quoted: message });
                }
                const diffEmoji = { easy: '🟢', medium: '🟡', hard: '🔴' };
                await sock.sendMessage(chatId, {
                    text: `🧩 *Sudoku — ${diffEmoji[difficulty]} ${difficulty.toUpperCase()}*\n` +
                        `📊 *${t('sudoku.clues')}:* ${data.clues}/81\n\n` +
                        `${t('sudoku.puzzleLabel')}\n\`\`\`\n${data.formatted_puzzle}\n\`\`\`\n\n` +
                        `${t('sudoku.codeLabel')}\n\`${data.puzzle}\`\n\n` +
                        t('sudoku.solveHintUse', { code: data.puzzle }),
                    ...channelInfo
                }, { quoted: message });
            }
            catch (error) {
                await sock.sendMessage(chatId, {
                    text: t('sudoku.generateFailed', { message: error.message }),
                    ...channelInfo
                }, { quoted: message });
            }
        }
        else if (subCmd === 'solve') {
            const grid = args[1]?.trim();
            if (!grid) {
                return await sock.sendMessage(chatId, {
                    text: t('sudoku.provideCode'),
                    ...channelInfo
                }, { quoted: message });
            }
            if (!/^[0-9]{81}$/.test(grid)) {
                return await sock.sendMessage(chatId, {
                    text: t('sudoku.invalidLength', { length: grid.length }),
                    ...channelInfo
                }, { quoted: message });
            }
            await sock.sendMessage(chatId, {
                text: t('sudoku.solving'),
                ...channelInfo
            }, { quoted: message });
            try {
                const { stdout } = await execAsync(`python3 "${scriptPath}" solve ${grid}`, { timeout: 30000 });
                const data = JSON.parse(stdout.trim());
                if (data.error) {
                    return await sock.sendMessage(chatId, {
                        text: `❌ ${data.error}`,
                        ...channelInfo
                    }, { quoted: message });
                }
                await sock.sendMessage(chatId, {
                    text: `${t('sudoku.solvedTitle')}\n` +
                        `✅ *${t('sudoku.filled')}:* ${data.filled} ${t('sudoku.emptyCells')}\n\n` +
                        `${t('sudoku.puzzleLabel')}\n\`\`\`\n${data.formatted_puzzle}\n\`\`\`\n\n` +
                        `${t('sudoku.solutionLabel')}\n\`\`\`\n${data.formatted_solution}\n\`\`\``,
                    ...channelInfo
                }, { quoted: message });
            }
            catch (error) {
                await sock.sendMessage(chatId, {
                    text: t('sudoku.solveFailed', { message: error.message }),
                    ...channelInfo
                }, { quoted: message });
            }
        }
        else {
            await sock.sendMessage(chatId, {
                text: t('sudoku.unknownSubcommand', { cmd: subCmd }),
                ...channelInfo
            }, { quoted: message });
        }
    }
};
