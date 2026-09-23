import t from '../lib/i18n.js';
export default {
    command: 'pokedex',
    aliases: ['pokemon', 'poke'],
    category: 'info',
    description: 'Get information about a Pokémon',
    usage: '.pokedex <pokemon name>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const text = args.join(' ').trim();
        if (!text) {
            return await sock.sendMessage(chatId, {
                text: t('pokedex.usage')
            }, { quoted: message });
        }
        try {
            const url = `https://some-random-api.com/pokemon/pokedex?pokemon=${encodeURIComponent(text)}`;
            const res = await fetch(url);
            const json = await res.json();
            if (!res.ok)
                throw json.error || 'Unknown error';
            const messageText = `
*≡ ${t('pokedex.name')}:* ${json.name}
*≡ ID:* ${json.id}
*≡ ${t('pokedex.type')}:* ${Array.isArray(json.type) ? json.type.join(', ') : json.type}
*≡ ${t('pokedex.abilities')}:* ${Array.isArray(json.abilities) ? json.abilities.join(', ') : json.abilities}
*≡ ${t('pokedex.species')}:* ${Array.isArray(json.species) ? json.species.join(', ') : json.species}
*≡ ${t('pokedex.height')}:* ${json.height}
*≡ ${t('pokedex.weight')}:* ${json.weight}
*≡ ${t('pokedex.experience')}:* ${json.base_experience}
*≡ ${t('pokedex.description')}:* ${json.description}
      `.trim();
            await sock.sendMessage(chatId, { text: messageText, quoted: message });
        }
        catch (error) {
            console.error('Pokedex Command Error:', error);
            await sock.sendMessage(chatId, { text: t('pokedex.error', { error }) }, { quoted: message });
        }
    }
};
