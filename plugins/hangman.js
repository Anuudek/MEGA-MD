import t from '../lib/i18n.js';
const words = ['javascript', 'bot', 'hangman', 'whatsapp', 'nodejs', 'python', 'programming', 'developer', 'computer', 'algorithm'];
const hangmanGames = {};
function guessLetter(sock, chatId, letter) {
    if (!hangmanGames[chatId]) {
        sock.sendMessage(chatId, { text: t('hangman.noGame') });
        return;
    }
    const game = hangmanGames[chatId];
    const { word, guessedLetters, maskedWord, maxWrongGuesses } = game;
    if (guessedLetters.includes(letter)) {
        sock.sendMessage(chatId, { text: t('hangman.alreadyGuessed', { letter }) });
        return;
    }
    guessedLetters.push(letter);
    if (word.includes(letter)) {
        for (let i = 0; i < word.length; i++) {
            if (word[i] === letter) {
                maskedWord[i] = letter;
            }
        }
        sock.sendMessage(chatId, { text: t('hangman.goodGuess', { word: maskedWord.join(' ') }) });
        if (!maskedWord.includes('_')) {
            sock.sendMessage(chatId, { text: t('hangman.congrats', { word }) });
            delete hangmanGames[chatId];
        }
    }
    else {
        game.wrongGuesses += 1;
        sock.sendMessage(chatId, { text: t('hangman.wrongGuess', { left: maxWrongGuesses - game.wrongGuesses, word: maskedWord.join(' ') }) });
        if (game.wrongGuesses >= maxWrongGuesses) {
            sock.sendMessage(chatId, { text: t('hangman.gameOver', { word }) });
            delete hangmanGames[chatId];
        }
    }
}
export default {
    command: 'hangman',
    aliases: ['hang', 'hm'],
    category: 'games',
    description: 'Play hangman word guessing game',
    usage: '.hangman to start, then .guess <letter>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const word = words[Math.floor(Math.random() * words.length)];
        const maskedWord = '_ '.repeat(word.length).trim();
        hangmanGames[chatId] = {
            word,
            maskedWord: maskedWord.split(' '),
            guessedLetters: [],
            wrongGuesses: 0,
            maxWrongGuesses: 6,
        };
        await sock.sendMessage(chatId, {
            text: t('hangman.started', { word: maskedWord })
        }, { quoted: message });
    },
    guessLetter
};
