import axios from 'axios';
import { channelInfo } from '../lib/messageConfig.js';
import t from '../lib/i18n.js';
export default {
    command: 'weather',
    aliases: ['forecast', 'climate'],
    category: 'info',
    description: 'Get the current weather for a specific city!',
    usage: '.weather <city>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const city = args.join(' ').trim();
        if (!city) {
            return await sock.sendMessage(chatId, {
                text: t('weather.usage'),
                ...channelInfo
            }, { quoted: message });
        }
        try {
            const apiKey = '060a6bcfa19809c2cd4d97a212b19273';
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=pt_br&appid=${apiKey}`);
            const weather = response.data;
            const weatherText = `${t('weather.title')}\n\n` +
                `「 🌅 」${t('weather.place')}: ${weather.name}\n` +
                `「 🗺️ 」${t('weather.country')}: ${weather.sys.country}\n` +
                `「 🌤️ 」${t('weather.view')}: ${weather.weather[0].description}\n` +
                `「 🌡️ 」${t('weather.temp')}: ${weather.main.temp}°C\n` +
                `「 💠 」${t('weather.minTemp')}: ${weather.main.temp_min}°C\n` +
                `「 🔥 」${t('weather.maxTemp')}: ${weather.main.temp_max}°C\n` +
                `「 💦 」${t('weather.humidity')}: ${weather.main.humidity}%\n` +
                `「 🌬️ 」${t('weather.wind')}: ${weather.wind.speed} km/h`;
            await sock.sendMessage(chatId, {
                text: weatherText,
                ...channelInfo
            }, { quoted: message });
        }
        catch (error) {
            console.error('Weather plugin error:', error);
            await sock.sendMessage(chatId, {
                text: t('weather.error'),
                ...channelInfo
            }, { quoted: message });
        }
    }
};
