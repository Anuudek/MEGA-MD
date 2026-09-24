import t from '../lib/i18n.js';

const PALAVRAS = [
    'abacaxi', 'amor', 'amigo', 'arvore', 'avatar', 'bola', 'banana', 'barco', 'boneca',
    'borboleta', 'cadeira', 'caderno', 'cachorro', 'casa', 'carro', 'cavalo', 'chave',
    'chuva', 'cidade', 'coelho', 'computador', 'coracao', 'cobra', 'dado', 'dedo', 'dente',
    'elefante', 'escola', 'espelho', 'estrela', 'fada', 'faca', 'floresta', 'fogo', 'foto',
    'futebol', 'galinha', 'gato', 'girafa', 'guitarra', 'historia', 'hospital', 'igreja',
    'ilha', 'internet', 'janela', 'jardim', 'jacare', 'lago', 'lampada', 'laranja', 'leao',
    'letra', 'livro', 'lua', 'macaco', 'mala', 'mao', 'mar', 'mesa', 'montanha', 'morango',
    'motor', 'musica', 'natureza', 'navio', 'ninho', 'noite', 'nuvem', 'oceano', 'olho',
    'onda', 'orelha', 'ovo', 'pao', 'papel', 'parede', 'passaro', 'pato', 'peixe', 'pente',
    'pera', 'ponte', 'porta', 'praia', 'prato', 'quadro', 'queijo', 'rato', 'relogio', 'rio',
    'roda', 'rosa', 'sabao', 'sapato', 'sapo', 'sol', 'sombra', 'tarde', 'telefone',
    'telhado', 'teto', 'tigre', 'tomate', 'trem', 'tubarao', 'urso', 'uva', 'vaca', 'vento',
    'vidro', 'violao', 'xicara', 'zebra',
];

const shiritoriGames = new Map();

function normalize(str) {
    return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function ultimaLetraDe(palavraNormalizada) {
    return palavraNormalizada[palavraNormalizada.length - 1];
}

function placar(game) {
    const entradas = [...game.pontuacao.entries()].sort((a, b) => b[1] - a[1]);
    if (!entradas.length) return t('shiritori.semPontos');
    return entradas.map(([id, pts], i) => `${i + 1}. @${id.split('@')[0]} - ${pts}`).join('\n');
}

export async function handleShiritoriMove(sock, chatId, senderId, text) {
    const game = shiritoriGames.get(chatId);
    if (!game)
        return false;

    const palavra = normalize(text);
    if (!palavra || palavra.length < 2 || !/^[a-z]+$/.test(palavra))
        return false;

    if (palavra[0] !== game.ultimaLetra)
        return false;

    if (game.usadas.has(palavra)) {
        await sock.sendMessage(chatId, { text: t('shiritori.jaUsada', { palavra }) });
        return true;
    }

    game.usadas.add(palavra);
    game.ultimaLetra = ultimaLetraDe(palavra);
    game.pontuacao.set(senderId, (game.pontuacao.get(senderId) || 0) + 1);

    await sock.sendMessage(chatId, {
        text: t('shiritori.aceita', { palavra, letra: game.ultimaLetra.toUpperCase(), user: senderId.split('@')[0] }),
        mentions: [senderId]
    });
    return true;
}

export default {
    command: 'shiritori',
    aliases: ['correntedepalavras', 'encadeado'],
    category: 'games',
    description: 'Corrente de palavras: cada palavra tem que comecar com a ultima letra da anterior',
    usage: '.shiritori',
    groupOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const action = args[0]?.toLowerCase();

        if (action === 'parar' || action === 'fim') {
            const game = shiritoriGames.get(chatId);
            if (!game) {
                await sock.sendMessage(chatId, { text: t('shiritori.semJogo') }, { quoted: message });
                return;
            }
            shiritoriGames.delete(chatId);
            await sock.sendMessage(chatId, {
                text: `${t('shiritori.encerrado')}\n\n${placar(game)}`,
                mentions: [...game.pontuacao.keys()]
            }, { quoted: message });
            return;
        }

        if (shiritoriGames.has(chatId)) {
            await sock.sendMessage(chatId, { text: t('shiritori.jaEmAndamento') }, { quoted: message });
            return;
        }

        const inicial = PALAVRAS[Math.floor(Math.random() * PALAVRAS.length)];
        const inicialNormalizada = normalize(inicial);
        const game = {
            usadas: new Set([inicialNormalizada]),
            ultimaLetra: ultimaLetraDe(inicialNormalizada),
            pontuacao: new Map(),
        };
        shiritoriGames.set(chatId, game);

        await sock.sendMessage(chatId, {
            text: t('shiritori.iniciado', { palavra: inicial, letra: game.ultimaLetra.toUpperCase() })
        }, { quoted: message });
    },
    handleShiritoriMove,
    shiritoriGames
};
