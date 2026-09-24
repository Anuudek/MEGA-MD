import t from '../lib/i18n.js';

const BANCO_PALAVRAS = [
    { word: 'gato', categoria: 'animal' },
    { word: 'cachorro', categoria: 'animal' },
    { word: 'elefante', categoria: 'animal' },
    { word: 'girafa', categoria: 'animal' },
    { word: 'tubarao', categoria: 'animal' },
    { word: 'macaco', categoria: 'animal' },
    { word: 'jacare', categoria: 'animal' },
    { word: 'banana', categoria: 'fruta' },
    { word: 'abacaxi', categoria: 'fruta' },
    { word: 'melancia', categoria: 'fruta' },
    { word: 'morango', categoria: 'fruta' },
    { word: 'laranja', categoria: 'fruta' },
    { word: 'manga', categoria: 'fruta' },
    { word: 'computador', categoria: 'objeto' },
    { word: 'telefone', categoria: 'objeto' },
    { word: 'guarda-chuva', categoria: 'objeto' },
    { word: 'bicicleta', categoria: 'objeto' },
    { word: 'chave', categoria: 'objeto' },
    { word: 'espelho', categoria: 'objeto' },
    { word: 'medico', categoria: 'profissao' },
    { word: 'professor', categoria: 'profissao' },
    { word: 'bombeiro', categoria: 'profissao' },
    { word: 'cozinheiro', categoria: 'profissao' },
    { word: 'engenheiro', categoria: 'profissao' },
    { word: 'brasil', categoria: 'pais' },
    { word: 'portugal', categoria: 'pais' },
    { word: 'argentina', categoria: 'pais' },
    { word: 'japao', categoria: 'pais' },
    { word: 'canada', categoria: 'pais' },
    { word: 'futebol', categoria: 'esporte' },
    { word: 'natacao', categoria: 'esporte' },
    { word: 'volei', categoria: 'esporte' },
    { word: 'basquete', categoria: 'esporte' },
    { word: 'surf', categoria: 'esporte' },
    { word: 'whatsapp', categoria: 'tecnologia' },
    { word: 'internet', categoria: 'tecnologia' },
    { word: 'javascript', categoria: 'tecnologia' },
    { word: 'teclado', categoria: 'tecnologia' },
];

const ESTAGIOS = [
`
 +---+
 |   |
     |
     |
     |
     |
=========`,
`
 +---+
 |   |
 O   |
     |
     |
     |
=========`,
`
 +---+
 |   |
 O   |
 |   |
     |
     |
=========`,
`
 +---+
 |   |
 O   |
/|   |
     |
     |
=========`,
`
 +---+
 |   |
 O   |
/|\\  |
     |
     |
=========`,
`
 +---+
 |   |
 O   |
/|\\  |
/    |
     |
=========`,
`
 +---+
 |   |
 O   |
/|\\  |
/ \\  |
     |
=========`,
];

const MAX_ERROS = ESTAGIOS.length - 1;
const forcaGames = new Map();

function normalize(str) {
    return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function renderMasked(palavraOriginal, palavraNormalizada, letrasCertas) {
    return palavraOriginal
        .split('')
        .map((ch, i) => {
            if (ch === '-' || ch === ' ') return ch;
            return letrasCertas.has(palavraNormalizada[i]) ? palavraOriginal[i] : '_';
        })
        .join(' ');
}

function renderStatus(game) {
    const masked = renderMasked(game.palavraOriginal, game.palavraNormalizada, game.letrasCertas);
    const erradas = game.letrasErradas.size ? [...game.letrasErradas].join(', ').toUpperCase() : '-';
    return `${ESTAGIOS[game.erros]}\n\n` +
        `${t('forca.categoria')}: *${game.categoria}*\n` +
        `${t('forca.palavra')}: *${masked}*\n` +
        `${t('forca.erradas')}: ${erradas}\n` +
        `${t('forca.tentativas')}: ${MAX_ERROS - game.erros}`;
}

export async function handleForcaGuess(sock, chatId, senderId, text) {
    const game = forcaGames.get(chatId);
    if (!game || game.status !== 'PLAYING')
        return false;

    const guess = normalize(text.trim());
    if (!guess || !/^[a-z-]+$/.test(guess))
        return false;

    if (guess.length === 1) {
        if (game.letrasCertas.has(guess) || game.letrasErradas.has(guess)) {
            await sock.sendMessage(chatId, { text: t('forca.letraRepetida', { letra: guess.toUpperCase() }) });
            return true;
        }
        if (game.palavraNormalizada.includes(guess)) {
            game.letrasCertas.add(guess);
        } else {
            game.letrasErradas.add(guess);
            game.erros++;
        }
    } else {
        if (guess.length !== game.palavraNormalizada.length)
            return false;
        if (guess === game.palavraNormalizada) {
            for (const ch of game.palavraNormalizada) game.letrasCertas.add(ch);
        } else {
            game.erros++;
        }
    }

    const venceu = game.palavraNormalizada.split('').every((ch) => ch === '-' || game.letrasCertas.has(ch));
    if (venceu) {
        game.status = 'DONE';
        await sock.sendMessage(chatId, {
            text: `${renderStatus(game)}\n\n${t('forca.venceu', { palavra: game.palavraOriginal, user: senderId.split('@')[0] })}`,
            mentions: [senderId]
        });
        forcaGames.delete(chatId);
        return true;
    }

    if (game.erros >= MAX_ERROS) {
        game.status = 'DONE';
        await sock.sendMessage(chatId, {
            text: `${renderStatus(game)}\n\n${t('forca.perdeu', { palavra: game.palavraOriginal })}`
        });
        forcaGames.delete(chatId);
        return true;
    }

    await sock.sendMessage(chatId, { text: renderStatus(game) });
    return true;
}

export default {
    command: 'forca',
    aliases: ['hangman', 'jogodaforca'],
    category: 'games',
    description: 'Jogo da forca em portugues, adivinhe a palavra letra por letra',
    usage: '.forca',
    groupOnly: false,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const action = args[0]?.toLowerCase();

        if (action === 'desistir' || action === 'cancelar') {
            if (!forcaGames.has(chatId)) {
                await sock.sendMessage(chatId, { text: t('forca.semJogo') }, { quoted: message });
                return;
            }
            const game = forcaGames.get(chatId);
            forcaGames.delete(chatId);
            await sock.sendMessage(chatId, { text: t('forca.desistiu', { palavra: game.palavraOriginal }) }, { quoted: message });
            return;
        }

        if (forcaGames.has(chatId)) {
            await sock.sendMessage(chatId, { text: t('forca.jaEmAndamento') }, { quoted: message });
            return;
        }

        const escolha = BANCO_PALAVRAS[Math.floor(Math.random() * BANCO_PALAVRAS.length)];
        const game = {
            palavraOriginal: escolha.word,
            palavraNormalizada: normalize(escolha.word),
            categoria: escolha.categoria,
            letrasCertas: new Set(),
            letrasErradas: new Set(),
            erros: 0,
            status: 'PLAYING',
        };
        forcaGames.set(chatId, game);

        await sock.sendMessage(chatId, {
            text: `${t('forca.iniciado')}\n\n${renderStatus(game)}\n\n${t('forca.instrucoes')}`
        }, { quoted: message });
    },
    handleForcaGuess,
    forcaGames
};
