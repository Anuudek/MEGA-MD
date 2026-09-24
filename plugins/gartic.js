import t from '../lib/i18n.js';

const BANCO_PALAVRAS = [
    { word: 'girassol', categoria: 'natureza' },
    { word: 'guitarra', categoria: 'musica' },
    { word: 'foguete', categoria: 'espaco' },
    { word: 'pirata', categoria: 'personagem' },
    { word: 'vampiro', categoria: 'personagem' },
    { word: 'castelo', categoria: 'lugar' },
    { word: 'dinossauro', categoria: 'animal' },
    { word: 'polvo', categoria: 'animal' },
    { word: 'arco-iris', categoria: 'natureza' },
    { word: 'vulcao', categoria: 'natureza' },
    { word: 'robo', categoria: 'tecnologia' },
    { word: 'fantasma', categoria: 'personagem' },
    { word: 'sereia', categoria: 'personagem' },
    { word: 'unicornio', categoria: 'animal' },
    { word: 'pizza', categoria: 'comida' },
    { word: 'sorvete', categoria: 'comida' },
    { word: 'hamburguer', categoria: 'comida' },
    { word: 'skate', categoria: 'objeto' },
    { word: 'violao', categoria: 'musica' },
    { word: 'bateria', categoria: 'musica' },
    { word: 'labirinto', categoria: 'lugar' },
    { word: 'cachoeira', categoria: 'natureza' },
    { word: 'astronauta', categoria: 'profissao' },
    { word: 'palhaco', categoria: 'personagem' },
    { word: 'super-heroi', categoria: 'personagem' },
    { word: 'zumbi', categoria: 'personagem' },
    { word: 'coruja', categoria: 'animal' },
    { word: 'camaleao', categoria: 'animal' },
    { word: 'balao', categoria: 'objeto' },
    { word: 'pipoca', categoria: 'comida' },
];

const ROUND_MS = 90000;
const REVEAL_INTERVAL_MS = 20000;
const REVEAL_FRACTION = 0.6;

const garticGames = new Map();

function normalize(str) {
    return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function renderMasked(palavraOriginal, revelada) {
    return palavraOriginal
        .split('')
        .map((ch, i) => (ch === '-' || ch === ' ' ? ch : (revelada.has(i) ? ch : '_')))
        .join(' ');
}

function placar(game) {
    const entradas = [...game.pontuacao.entries()].sort((a, b) => b[1] - a[1]);
    if (!entradas.length) return t('gartic.semPontos');
    return entradas.map(([id, pts], i) => `${i + 1}. @${id.split('@')[0]} - ${pts}`).join('\n');
}

function encerrarRodada(sock, chatId, motivo) {
    const game = garticGames.get(chatId);
    if (!game) return;
    clearInterval(game.revealTimer);
    clearTimeout(game.endTimer);
    garticGames.delete(chatId);
    return game;
}

async function iniciarNovaPalavra(sock, chatId) {
    const escolha = BANCO_PALAVRAS[Math.floor(Math.random() * BANCO_PALAVRAS.length)];
    const letraIndices = [...escolha.word].map((ch, i) => (ch === '-' || ch === ' ' ? -1 : i)).filter((i) => i !== -1);
    const maxRevelaveis = Math.max(1, Math.floor(letraIndices.length * REVEAL_FRACTION));

    const game = garticGames.get(chatId) || { pontuacao: new Map() };
    game.palavraOriginal = escolha.word;
    game.palavraNormalizada = normalize(escolha.word);
    game.categoria = escolha.categoria;
    game.revelada = new Set();
    game.letraIndices = letraIndices;
    game.maxRevelaveis = maxRevelaveis;
    game.status = 'PLAYING';

    garticGames.set(chatId, game);

    game.revealTimer = setInterval(async () => {
        const restantes = game.letraIndices.filter((i) => !game.revelada.has(i));
        if (game.revelada.size >= game.maxRevelaveis || restantes.length === 0) {
            clearInterval(game.revealTimer);
            return;
        }
        const idx = restantes[Math.floor(Math.random() * restantes.length)];
        game.revelada.add(idx);
        await sock.sendMessage(chatId, {
            text: t('gartic.dica', { masked: renderMasked(game.palavraOriginal, game.revelada) })
        });
    }, REVEAL_INTERVAL_MS);

    game.endTimer = setTimeout(async () => {
        encerrarRodada(sock, chatId);
        await sock.sendMessage(chatId, {
            text: t('gartic.tempoEsgotado', { palavra: escolha.word })
        });
    }, ROUND_MS);

    await sock.sendMessage(chatId, {
        text: t('gartic.iniciado', {
            categoria: escolha.categoria,
            masked: renderMasked(escolha.word, new Set()),
            segundos: ROUND_MS / 1000
        })
    });
}

export async function handleGarticGuess(sock, chatId, senderId, text) {
    const game = garticGames.get(chatId);
    if (!game || game.status !== 'PLAYING')
        return false;

    const guess = normalize(text);
    if (!guess || guess.length < 2)
        return false;

    if (guess !== game.palavraNormalizada)
        return false;

    game.status = 'DONE';
    clearInterval(game.revealTimer);
    clearTimeout(game.endTimer);
    game.pontuacao.set(senderId, (game.pontuacao.get(senderId) || 0) + 1);

    await sock.sendMessage(chatId, {
        text: t('gartic.acertou', { user: senderId.split('@')[0], palavra: game.palavraOriginal }),
        mentions: [senderId]
    });

    setTimeout(() => iniciarNovaPalavra(sock, chatId), 3000);
    return true;
}

export default {
    command: 'gartic',
    aliases: ['desenho', 'adivinhe'],
    category: 'games',
    description: 'Adivinhe a palavra por categoria e dicas reveladas aos poucos',
    usage: '.gartic',
    groupOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const action = args[0]?.toLowerCase();

        if (action === 'parar' || action === 'fim') {
            const game = encerrarRodada(sock, chatId);
            if (!game) {
                await sock.sendMessage(chatId, { text: t('gartic.semJogo') }, { quoted: message });
                return;
            }
            await sock.sendMessage(chatId, {
                text: `${t('gartic.encerrado', { palavra: game.palavraOriginal })}\n\n${placar(game)}`,
                mentions: [...game.pontuacao.keys()]
            }, { quoted: message });
            return;
        }

        if (garticGames.has(chatId) && garticGames.get(chatId).status === 'PLAYING') {
            await sock.sendMessage(chatId, { text: t('gartic.jaEmAndamento') }, { quoted: message });
            return;
        }

        await iniciarNovaPalavra(sock, chatId);
    },
    handleGarticGuess,
    garticGames
};
