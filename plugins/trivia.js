import axios from 'axios';
import t from '../lib/i18n.js';
const triviaGames = {};
export default {
    command: 'trivia',
    aliases: ['quiz'],
    category: 'games',
    description: 'Start a trivia game or answer the question',
    usage: '.trivia [answer]',
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        if (args.length === 0) {
            if (triviaGames[chatId]) {
                await sock.sendMessage(chatId, {
                    text: t('trivia.alreadyInProgress'),
                    ...channelInfo
                }, { quoted: message });
                return;
            }
            try {
                const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
                const questionData = response.data.results[0];
                triviaGames[chatId] = {
                    question: questionData.question,
                    correctAnswer: questionData.correct_answer,
                    options: [...questionData.incorrect_answers, questionData.correct_answer].sort(),
                };
                await sock.sendMessage(chatId, {
                    text: `${t('trivia.questionTitle')}\n\n*${t('trivia.question')}:* ${triviaGames[chatId].question}\n\n*${t('trivia.options')}:*\n${triviaGames[chatId].options.join('\n')}\n\n${t('trivia.howToAnswer')}`,
                    ...channelInfo
                }, { quoted: message });
            }
            catch (error) {
                await sock.sendMessage(chatId, {
                    text: t('trivia.fetchError'),
                    ...channelInfo
                }, { quoted: message });
            }
        }
        else {
            if (!triviaGames[chatId]) {
                await sock.sendMessage(chatId, {
                    text: t('trivia.noGame'),
                    ...channelInfo
                }, { quoted: message });
                return;
            }
            const game = triviaGames[chatId];
            const answer = args.join(' ');
            if (answer.toLowerCase() === game.correctAnswer.toLowerCase()) {
                await sock.sendMessage(chatId, {
                    text: t('trivia.correct', { answer: game.correctAnswer }),
                    ...channelInfo
                }, { quoted: message });
            }
            else {
                await sock.sendMessage(chatId, {
                    text: t('trivia.wrong', { answer: game.correctAnswer }),
                    ...channelInfo
                }, { quoted: message });
            }
            delete triviaGames[chatId];
        }
    }
};
