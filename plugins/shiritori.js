import t from '../lib/i18n.js';
import { silabificar, normalizeSyllable } from '../lib/syllables.js';

const PALAVRAS = [
    'abacaxi', 'amor', 'amigo', 'árvore', 'avatar', 'bola', 'banana', 'barco', 'boneca',
    'borboleta', 'cadeira', 'caderno', 'cachorro', 'casa', 'carro', 'cavalo', 'chave',
    'chuva', 'cidade', 'coelho', 'computador', 'coração', 'cobra', 'dado', 'dedo', 'dente',
    'elefante', 'escola', 'espelho', 'estrela', 'fada', 'faca', 'floresta', 'fogo', 'foto',
    'futebol', 'galinha', 'gato', 'girafa', 'guitarra', 'história', 'hospital', 'igreja',
    'ilha', 'internet', 'janela', 'jardim', 'jacaré', 'lago', 'lâmpada', 'laranja', 'leão',
    'letra', 'livro', 'lua', 'macaco', 'mala', 'mão', 'mar', 'mesa', 'montanha', 'morango',
    'motor', 'música', 'natureza', 'navio', 'ninho', 'noite', 'nuvem', 'oceano', 'olho',
    'onda', 'orelha', 'ovo', 'pão', 'papel', 'parede', 'pássaro', 'pato', 'peixe', 'pente',
    'pera', 'ponte', 'porta', 'praia', 'prato', 'quadro', 'queijo', 'rato', 'relógio', 'rio',
    'roda', 'rosa', 'sabão', 'sapato', 'sapo', 'sol', 'sombra', 'tarde', 'telefone',
    'telhado', 'teto', 'tigre', 'tomate', 'trem', 'tubarão', 'urso', 'uva', 'vaca', 'vento',
    'vidro', 'violão', 'xícara', 'zebra',
];

const TURN_TIMEOUT_MS = 45000;
const shiritoriGames = new Map();

function ultimaSilabaDe(palavra) {
    const silabas = silabificar(palavra);
    return normalizeSyllable(silabas[silabas.length - 1]);
}

function primeiraSilabaDe(palavra) {
    const silabas = silabificar(palavra);
    return normalizeSyllable(silabas[0]);
}

function jogadorDaVez(game) {
    return game.players[game.currentIndex];
}

function limparTimer(game) {
    if (game.turnTimer) {
        clearTimeout(game.turnTimer);
        game.turnTimer = null;
    }
}

function armarTimer(sock, chatId, game) {
    limparTimer(game);
    game.turnTimer = setTimeout(async () => {
        await eliminar(sock, chatId, jogadorDaVez(game), t('shiritori.eliminadoTempo', { user: jogadorDaVez(game).split('@')[0] }));
    }, TURN_TIMEOUT_MS);
}

async function eliminar(sock, chatId, senderId, motivoTexto) {
    const game = shiritoriGames.get(chatId);
    if (!game) return;

    const idx = game.players.indexOf(senderId);
    if (idx !== -1) game.players.splice(idx, 1);

    if (game.players.length <= 1) {
        limparTimer(game);
        const vencedor = game.players[0];
        shiritoriGames.delete(chatId);
        const textoFinal = vencedor
            ? `${motivoTexto}\n\n${t('shiritori.vencedor', { user: vencedor.split('@')[0] })}`
            : motivoTexto;
        await sock.sendMessage(chatId, {
            text: textoFinal,
            mentions: [senderId, vencedor].filter(Boolean)
        });
        return;
    }

    if (game.currentIndex >= game.players.length) {
        game.currentIndex = 0;
    }
    const proximo = jogadorDaVez(game);
    await sock.sendMessage(chatId, {
        text: `${motivoTexto}${t('shiritori.proximaRodada', { silaba: game.ultimaSilaba.toUpperCase(), user: proximo.split('@')[0] })}`,
        mentions: [senderId, proximo]
    });
    armarTimer(sock, chatId, game);
}

export async function handleShiritoriMove(sock, chatId, senderId, text) {
    const game = shiritoriGames.get(chatId);
    if (!game || game.status !== 'PLAYING')
        return false;

    if (senderId !== jogadorDaVez(game))
        return false;

    const palavra = text.trim();
    if (!palavra || /\s/.test(palavra) || palavra.length < 2)
        return false;
    const normalizada = normalizeSyllable(palavra);
    if (!/^[a-z]+$/.test(normalizada))
        return false;

    limparTimer(game);

    if (game.usadas.has(normalizada)) {
        await eliminar(sock, chatId, senderId, t('shiritori.eliminadoRepetida', { user: senderId.split('@')[0], palavra }));
        return true;
    }

    const primeira = primeiraSilabaDe(palavra);
    if (primeira !== game.ultimaSilaba) {
        await eliminar(sock, chatId, senderId, t('shiritori.eliminadoSilaba', { user: senderId.split('@')[0], palavra, silaba: game.ultimaSilaba.toUpperCase() }));
        return true;
    }

    game.usadas.add(normalizada);
    game.ultimaSilaba = ultimaSilabaDe(palavra);
    game.currentIndex = (game.currentIndex + 1) % game.players.length;
    const proximo = jogadorDaVez(game);

    await sock.sendMessage(chatId, {
        text: t('shiritori.aceita', { palavra, silaba: game.ultimaSilaba.toUpperCase(), user: proximo.split('@')[0] }),
        mentions: [proximo]
    });
    armarTimer(sock, chatId, game);
    return true;
}

export default {
    command: 'shiritori',
    aliases: ['correntedepalavras', 'encadeado'],
    category: 'games',
    description: 'Shiritori: corrente de palavras por sílaba, em roda, com eliminação',
    usage: '.shiritori',
    groupOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const senderId = context.senderId || message.key.participant || message.key.remoteJid;
        const action = args[0]?.toLowerCase();

        if (action === 'parar' || action === 'fim') {
            const game = shiritoriGames.get(chatId);
            if (!game) {
                await sock.sendMessage(chatId, { text: t('shiritori.semJogo') }, { quoted: message });
                return;
            }
            limparTimer(game);
            shiritoriGames.delete(chatId);
            await sock.sendMessage(chatId, { text: t('shiritori.encerrado') }, { quoted: message });
            return;
        }

        if (action === 'entrar') {
            const game = shiritoriGames.get(chatId);
            if (!game || game.status !== 'LOBBY') {
                await sock.sendMessage(chatId, { text: t('shiritori.semLobbyParaEntrar') }, { quoted: message });
                return;
            }
            if (game.players.includes(senderId)) {
                await sock.sendMessage(chatId, { text: t('shiritori.jaNoLobby', { user: senderId.split('@')[0] }), mentions: [senderId] }, { quoted: message });
                return;
            }
            game.players.push(senderId);
            await sock.sendMessage(chatId, {
                text: t('shiritori.entrouNoLobby', { user: senderId.split('@')[0], total: game.players.length }),
                mentions: [senderId]
            }, { quoted: message });
            return;
        }

        if (action === 'iniciar') {
            const game = shiritoriGames.get(chatId);
            if (!game || game.status !== 'LOBBY') {
                await sock.sendMessage(chatId, { text: t('shiritori.semLobbyParaEntrar') }, { quoted: message });
                return;
            }
            if (game.players.length < 2) {
                await sock.sendMessage(chatId, { text: t('shiritori.poucosJogadores') }, { quoted: message });
                return;
            }
            const inicial = PALAVRAS[Math.floor(Math.random() * PALAVRAS.length)];
            game.status = 'PLAYING';
            game.usadas = new Set([normalizeSyllable(inicial)]);
            game.ultimaSilaba = ultimaSilabaDe(inicial);
            game.currentIndex = 0;
            shiritoriGames.set(chatId, game);

            const primeiro = jogadorDaVez(game);
            await sock.sendMessage(chatId, {
                text: t('shiritori.iniciado', { palavra: inicial, silaba: game.ultimaSilaba.toUpperCase(), user: primeiro.split('@')[0] }),
                mentions: [primeiro]
            }, { quoted: message });
            armarTimer(sock, chatId, game);
            return;
        }

        if (shiritoriGames.has(chatId)) {
            await sock.sendMessage(chatId, { text: t('shiritori.jaEmAndamento') }, { quoted: message });
            return;
        }

        shiritoriGames.set(chatId, {
            status: 'LOBBY',
            players: [senderId],
            currentIndex: 0,
            usadas: new Set(),
            ultimaSilaba: '',
            turnTimer: null,
        });

        await sock.sendMessage(chatId, {
            text: t('shiritori.lobbyAberto', { user: senderId.split('@')[0] }),
            mentions: [senderId]
        }, { quoted: message });
    },
    handleShiritoriMove,
    shiritoriGames
};
