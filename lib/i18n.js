// Minimal in-house translation helper (written from scratch for allhands,
// not copied from any third-party fork). Add more languages/keys here as
// more plugins get translated.
const messages = {
    'pt-BR': {
        smartmenu: {
            title: 'MENU DO {botName}',
            bot: 'Bot',
            version: 'Versão',
            owner: 'Dono',
            time: 'Hora',
            prefix: 'Prefixo',
            plugins: 'Plugins',
            topCommands: 'MAIS USADOS',
            uses: 'usos',
            legend: 'LEGENDA',
            active: 'Comando ativo',
            disabled: 'Comando desativado',
            fast: 'Resposta rápida',
            slow: 'Resposta lenta',
            error: 'Erro no menu',
        },
        tictactoe: {
            notYourTurn: '❌ Não é a sua vez!',
            invalidMove: '❌ Jogada inválida! Essa posição já está ocupada.',
            surrendered: '🏳️ @{loser} desistiu! @{winner} venceu o jogo!',
            wins: '🎉 @{winner} venceu o jogo!',
            draw: '🤝 O jogo empatou!',
            turn: '🎲 Vez de: @{player} ({symbol})',
            gameTitle: '🎮 *Jogo da Velha*',
            playerX: 'Jogador ❎',
            playerO: 'Jogador ⭕',
            instructions: '• Digite um número (1-9) pra jogar\n• Digite *desistir* pra abandonar o jogo',
            alreadyInGame: '*Você já está em uma partida*\n\nDigite *desistir* pra sair da partida atual primeiro.',
            gameStarted: '🎮 *Jogo da Velha Iniciado!*',
            waitingFor: 'Esperando @{player} jogar...',
            roomId: 'ID da Sala',
            rules: 'Regras',
            ruleLine: '• Faça 3 símbolos em linha, coluna ou diagonal pra vencer\n• Digite um número (1-9) pra marcar sua posição\n• Digite *desistir* pra abandonar',
            waitingOpponent: '*Esperando adversário*\n\nDigite `.tictactoe {room}` pra entrar nessa partida!\n\nJogador ❎: @{player}',
            startError: '❌ *Erro ao iniciar a partida*\n\nTente novamente mais tarde.',
        },
        trivia: {
            alreadyInProgress: 'Já tem uma partida de trivia em andamento!',
            questionTitle: '🎯 *Hora do Trivia!*',
            question: 'Pergunta',
            options: 'Opções',
            howToAnswer: 'Use .trivia <resposta> pra responder!',
            fetchError: 'Erro ao buscar a pergunta do trivia. Tente novamente mais tarde.',
            noGame: 'Não tem nenhuma partida de trivia em andamento. Use .trivia pra começar uma!',
            correct: '✅ Certo! A resposta é *{answer}*',
            wrong: '❌ Errado! A resposta certa era *{answer}*',
        },
        dare: {
            fetchError: '❌ Não consegui buscar um desafio. Tente novamente mais tarde!',
        },
        eightball: {
            askQuestion: '🎱 Faça uma pergunta!',
            questionLabel: 'Pergunta',
            answerLabel: 'Resposta',
            error: '❌ Algo deu errado com a bola 8 mágica!',
            responses: [
                'Sim, com certeza!',
                'De jeito nenhum!',
                'Pergunte de novo mais tarde.',
                'É certo.',
                'Muito duvidoso.',
                'Sem dúvida.',
                'Minha resposta é não.',
                'Os sinais apontam para sim.',
            ],
        },
        antilink: {
            setupTitle: '*🔗 CONFIGURAÇÃO DO ANTILINK*',
            currentStatus: 'Status Atual',
            enabled: '✅ Ativado',
            disabled: '❌ Desativado',
            currentAction: 'Ação Atual',
            notSet: 'Não definida',
            commands: 'Comandos',
            cmdOn: '`.antilink on` - Ativa o antilink',
            cmdOff: '`.antilink off` - Desativa o antilink',
            cmdSetDelete: '`.antilink set delete` - Apaga mensagens com link',
            cmdSetKick: '`.antilink set kick` - Remove quem manda link',
            cmdSetWarn: '`.antilink set warn` - Só avisa',
            protectedLinks: 'Links Protegidos',
            whatsappGroups: 'Grupos de WhatsApp',
            whatsappChannels: 'Canais de WhatsApp',
            telegram: 'Telegram',
            otherLinks: 'Outros links',
            exemptNote: '*Nota:* Admins, Dono e usuários Sudo estão isentos.',
            alreadyEnabled: '⚠️ *O antilink já está ativado*',
            enableFailed: '❌ *Falha ao ativar o antilink*',
            enabledSuccess: '✅ *Antilink ativado com sucesso!*\n\nAção padrão: Apagar mensagens\n\n*Isentos:* Admins, Dono, usuários Sudo',
            disabledMsg: '❌ *Antilink desativado*\n\nOs usuários agora podem enviar links livremente.',
            specifyAction: '❌ *Especifique uma ação*\n\nUso: `.antilink set delete | kick | warn`',
            invalidAction: '❌ *Ação inválida*\n\nEscolha: delete, kick ou warn',
            setFailed: '❌ *Falha ao definir a ação do antilink*',
            actionSet: '✅ *Ação do antilink definida como: {action}*',
            actionDeleteDesc: 'Apaga mensagens com link e avisa os usuários',
            actionKickDesc: 'Apaga a mensagem e remove o usuário',
            actionWarnDesc: 'Só envia mensagens de aviso',
            statusTitle: '*🔗 STATUS DO ANTILINK*',
            status: 'Status',
            action: 'Ação',
            whatHappens: 'O que acontece quando um link é detectado',
            deleteExplain: '• A mensagem é apagada\n• O usuário recebe um aviso',
            kickExplain: '• A mensagem é apagada\n• O usuário é removido do grupo',
            warnExplain: '• O usuário recebe um aviso\n• A mensagem permanece',
            invalidCommand: '❌ *Comando inválido*\n\nUse `.antilink` pra ver as opções disponíveis.',
            warningMsg: '⚠️ *Aviso de Antilink*\n\n@{user}, não é permitido enviar links do tipo {linkType}!',
            kickedMsg: '🚫 @{user} foi removido por enviar links do tipo {linkType}.',
            kickFailed: '⚠️ Falha ao remover o usuário. Confirme se o bot é admin do grupo.',
            linkTypeWhatsappGroup: 'Grupo de WhatsApp',
            linkTypeWhatsappChannel: 'Canal de WhatsApp',
            linkTypeTelegram: 'Telegram',
            linkTypeGeneric: 'Link',
        },
        ban: {
            usage: '❌ *Marque um usuário ou responda à mensagem dele*\n\nUso: `.ban @usuario` ou responda com `.ban`',
            cannotBanBot: '❌ *Não é possível banir a conta do bot*',
            bannedSuccess: '🚫 *Usuário banido com sucesso!*\n\n@{user} foi banido de usar o bot.\n\n*Armazenamento:* {storage}',
            alreadyBanned: '⚠️ *Já banido*\n\n@{user} já está banido!',
            failed: '❌ *Falha ao banir o usuário!*\n\nTente novamente.',
            storageDb: 'Banco de dados',
            storageFile: 'Arquivo',
        },
        warn: {
            usage: '❌ Erro: mencione o usuário ou responda à mensagem dele para avisar!',
            title: '*『 AVISO 』*',
            warnedUser: 'Usuário Avisado',
            warnCount: 'Total de Avisos',
            warnedBy: 'Avisado por',
            storage: 'Armazenamento',
            storageDb: 'Banco de dados',
            storageFile: 'Arquivo',
            date: 'Data',
            failed: '❌ Falha ao avisar o usuário!',
            rateLimited: '❌ Limite de tentativas atingido. Tente novamente em alguns segundos.',
            failedPermission: '❌ Falha ao avisar o usuário. Confirme se o bot é admin e tem permissão suficiente.',
            kickTitle: '*『 REMOÇÃO AUTOMÁTICA 』*',
            kickMsg: '@{user} foi removido do grupo após receber 3 avisos! ⚠️',
        },
        sticker2: {
            usage: 'Responda a uma imagem/vídeo com .sticker2, ou envie uma imagem/vídeo usando .sticker2 como legenda.',
            downloadFailed: 'Falha ao baixar a mídia. Tente novamente.',
            createFailed: 'Falha ao criar a figurinha! Tente novamente mais tarde.',
        },
        list: {
            bot: 'Bot',
            prefix: 'Prefixo',
            plugins: 'Plugins',
            version: 'Versão',
            time: 'Hora',
            notFound: '❌ Comando "{cmd}" não encontrado.\n\nUse {prefix}menu para ver todos os comandos.',
            infoTitle: 'INFO DO COMANDO',
            command: 'Comando',
            desc: 'Descrição',
            noDescription: 'Sem descrição',
            usage: 'Uso',
            category: 'Categoria',
            aliases: 'Apelidos',
            none: 'Nenhum',
        },
    },
};

const DEFAULT_LANG = process.env.LANGUAGE || 'pt-BR';

function resolve(key, lang) {
    const parts = key.split('.');
    let node = messages[lang];
    for (const part of parts) {
        node = node?.[part];
        if (node === undefined)
            return undefined;
    }
    return node;
}

export function t(key, vars = {}) {
    const value = resolve(key, DEFAULT_LANG) ?? resolve(key, 'pt-BR');
    if (typeof value !== 'string')
        return key;
    return value.replace(/\{(\w+)\}/g, (_, name) => (vars[name] !== undefined ? String(vars[name]) : `{${name}}`));
}

export function tList(key) {
    const value = resolve(key, DEFAULT_LANG) ?? resolve(key, 'pt-BR');
    return Array.isArray(value) ? value : [];
}

export default t;
