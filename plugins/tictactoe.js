import TicTacToe from '../lib/tictactoe.js';
import t from '../lib/i18n.js';
const games = {};
export async function handleTicTacToeMove(sock, chatId, senderId, text) {
    try {
        const room = Object.values(games).find((room) => room.id.startsWith('tictactoe') &&
            [room.game.playerX, room.game.playerO].includes(senderId) &&
            room.state === 'PLAYING');
        if (!room)
            return;
        const isSurrender = /^(surrender|give up|desistir)$/i.test(text);
        if (!isSurrender && !/^[1-9]$/.test(text))
            return;
        if (senderId !== room.game.currentTurn && !isSurrender) {
            await sock.sendMessage(chatId, {
                text: t('tictactoe.notYourTurn')
            });
            return;
        }
        const ok = isSurrender ? true : room.game.turn(senderId === room.game.playerO, parseInt(text, 10) - 1);
        if (!ok) {
            await sock.sendMessage(chatId, {
                text: t('tictactoe.invalidMove')
            });
            return;
        }
        let winner = room.game.winner;
        const isTie = room.game.turns === 9;
        const arr = room.game.render().map((v) => ({
            'X': '❎',
            'O': '⭕',
            '1': '1️⃣',
            '2': '2️⃣',
            '3': '3️⃣',
            '4': '4️⃣',
            '5': '5️⃣',
            '6': '6️⃣',
            '7': '7️⃣',
            '8': '8️⃣',
            '9': '9️⃣',
        }[v] || v));
        if (isSurrender) {
            winner = senderId === room.game.playerX ? room.game.playerO : room.game.playerX;
            await sock.sendMessage(chatId, {
                text: t('tictactoe.surrendered', { loser: senderId.split('@')[0], winner: winner.split('@')[0] }),
                mentions: [senderId, winner]
            });
            delete games[room.id];
            return;
        }
        let gameStatus;
        if (winner) {
            gameStatus = t('tictactoe.wins', { winner: winner.split('@')[0] });
        }
        else if (isTie) {
            gameStatus = t('tictactoe.draw');
        }
        else {
            gameStatus = t('tictactoe.turn', { player: room.game.currentTurn.split('@')[0], symbol: senderId === room.game.playerX ? '❎' : '⭕' });
        }
        const str = `
${t('tictactoe.gameTitle')}

${gameStatus}

${arr.slice(0, 3).join('')}
${arr.slice(3, 6).join('')}
${arr.slice(6).join('')}

▢ ${t('tictactoe.playerX')}: @${room.game.playerX.split('@')[0]}
▢ ${t('tictactoe.playerO')}: @${room.game.playerO.split('@')[0]}

${!winner && !isTie ? t('tictactoe.instructions') : ''}
`;
        const mentions = [
            room.game.playerX,
            room.game.playerO,
            ...(winner ? [winner] : [room.game.currentTurn])
        ];
        await sock.sendMessage(room.x, {
            text: str,
            mentions
        });
        if (room.x !== room.o) {
            await sock.sendMessage(room.o, {
                text: str,
                mentions
            });
        }
        if (winner || isTie) {
            delete games[room.id];
        }
    }
    catch (error) {
        console.error('Error in tictactoe move:', error);
    }
}
export default {
    command: 'tictactoe',
    aliases: ['ttt', 'xo'],
    category: 'games',
    description: 'Play TicTacToe game with another user',
    usage: '.tictactoe [room name]',
    groupOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const senderId = context.senderId || message.key.participant || message.key.remoteJid;
        const text = args.join(' ').trim();
        try {
            if (Object.values(games).find((room) => room.id.startsWith('tictactoe') &&
                [room.game.playerX, room.game.playerO].includes(senderId))) {
                await sock.sendMessage(chatId, {
                    text: t('tictactoe.alreadyInGame')
                }, { quoted: message });
                return;
            }
            let room = Object.values(games).find((room) => room.state === 'WAITING' &&
                (text ? room.name === text : true));
            if (room) {
                room.o = chatId;
                room.game.playerO = senderId;
                room.state = 'PLAYING';
                const arr = room.game.render().map((v) => ({
                    'X': '❎',
                    'O': '⭕',
                    '1': '1️⃣',
                    '2': '2️⃣',
                    '3': '3️⃣',
                    '4': '4️⃣',
                    '5': '5️⃣',
                    '6': '6️⃣',
                    '7': '7️⃣',
                    '8': '8️⃣',
                    '9': '9️⃣',
                }[v] || v));
                const str = `
${t('tictactoe.gameStarted')}

${t('tictactoe.waitingFor', { player: room.game.currentTurn.split('@')[0] })}

${arr.slice(0, 3).join('')}
${arr.slice(3, 6).join('')}
${arr.slice(6).join('')}

▢ *${t('tictactoe.roomId')}:* ${room.id}
▢ *${t('tictactoe.rules')}:*
${t('tictactoe.ruleLine')}
`;
                await sock.sendMessage(chatId, {
                    text: str,
                    mentions: [room.game.currentTurn, room.game.playerX, room.game.playerO]
                }, { quoted: message });
            }
            else {
                room = {
                    id: `tictactoe-${ +new Date}`,
                    x: chatId,
                    o: '',
                    game: new TicTacToe(senderId, 'o'),
                    state: 'WAITING'
                };
                if (text)
                    room.name = text;
                await sock.sendMessage(chatId, {
                    text: t('tictactoe.waitingOpponent', { room: text || '' }) + `\n\n${t('tictactoe.playerX')}: @${senderId.split('@')[0]}`,
                    mentions: [senderId]
                }, { quoted: message });
                games[room.id] = room;
            }
        }
        catch (error) {
            console.error('Error in tictactoe command:', error);
            await sock.sendMessage(chatId, {
                text: t('tictactoe.startError')
            }, { quoted: message });
        }
    },
    handleTicTacToeMove,
    games
};
