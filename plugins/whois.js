import axios from 'axios';
import t from '../lib/i18n.js';
export default {
    command: 'whois',
    aliases: ['domaininfo'],
    category: 'info',
    description: 'Get WHOIS information of a domain',
    usage: '.whois <domain>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        let domain = args?.[0]?.trim();
        if (!domain) {
            return await sock.sendMessage(chatId, { text: t('whois.usage') }, { quoted: message });
        }
        domain = domain.replace(/^https?:\/\//i, '');
        try {
            if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
                return await sock.sendMessage(chatId, { text: t('whois.invalidDomain') }, { quoted: message });
            }
            const apiUrl = `https://discardapi.dpdns.org/api/tools/whois?apikey=guru&domain=${encodeURIComponent(domain)}`;
            const { data } = await axios.get(apiUrl, { timeout: 10000 });
            if (!data?.status || !data.result?.domain) {
                return await sock.sendMessage(chatId, { text: t('whois.fetchFailed') }, { quoted: message });
            }
            const { domain: dom, registrar, registrant, technical } = data.result;
            const text = `${t('whois.title')}\n\n` +
                `• ${t('whois.domain')}: ${dom.domain}\n` +
                `• ${t('whois.name')}: ${dom.name}\n` +
                `• ${t('whois.extension')}: .${dom.extension}\n` +
                `• ${t('whois.whoisServer')}: ${dom.whois_server}\n` +
                `• ${t('whois.status')}: ${dom.status.join(', ')}\n` +
                `• ${t('whois.nameServers')}: ${dom.name_servers.join(', ')}\n` +
                `• ${t('whois.created')}: ${dom.created_date_in_time}\n` +
                `• ${t('whois.updated')}: ${dom.updated_date_in_time}\n` +
                `• ${t('whois.expires')}: ${dom.expiration_date_in_time}\n\n` +
                `🏢 ${t('whois.registrar')}: ${registrar.name}\n` +
                `📞 ${t('whois.phone')}: ${registrar.phone}\n` +
                `📧 ${t('whois.email')}: ${registrar.email}\n` +
                `🔗 ${t('whois.website')}: ${registrar.referral_url}\n\n` +
                `👤 ${t('whois.registrant')}: ${registrant.organization || 'N/A'}\n` +
                `🌍 ${t('whois.country')}: ${registrant.country || 'N/A'}\n` +
                `📧 ${t('whois.email')}: ${registrant.email || 'N/A'}\n\n` +
                `⚙ ${t('whois.technicalEmail')}: ${technical.email || 'N/A'}`;
            await sock.sendMessage(chatId, { text }, { quoted: message });
        }
        catch (error) {
            console.error('WHOIS plugin error:', error);
            if (error.code === 'ECONNABORTED') {
                await sock.sendMessage(chatId, { text: t('whois.timeout') }, { quoted: message });
            }
            else {
                await sock.sendMessage(chatId, { text: t('whois.error') }, { quoted: message });
            }
        }
    }
};
