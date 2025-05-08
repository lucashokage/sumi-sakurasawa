const handler = async (m, { conn, args }) => {
    // Verificación básica de argumentos
    if (!args || args.length < 2) {
        return m.reply(`✳️ Ejemplo de uso:\n.chReact https://whatsapp.com/channel/0029VbAuC6yEquiGBk2VjT2O/100 "texto de reacción"`);
    }

    // Validación estricta del enlace del canal
    const channelLinkRegex = /^https:\/\/whatsapp\.com\/channel\/([A-Za-z0-9]{22})\/([A-Za-z0-9]+)$/;
    const match = args[0].match(channelLinkRegex);
    
    if (!match) {
        return m.reply("❌ Enlace no válido. Debe ser en formato:\nhttps://whatsapp.com/channel/ID_CANAL/ID_MENSAJE\n\nEjemplo:\nhttps://whatsapp.com/channel/0029VbAuC6yEquiGBk2VjT2O/100");
    }

    const [, channelId, messageId] = match;

    // Mapeo de caracteres a emojis estilizados
    const styleMap = {
        a: '🅐', b: '🅑', c: '🅒', d: '🅓', e: '🅔', f: '🅕', g: '🅖',
        h: '🅗', i: '🅘', j: '🅙', k: '🅚', l: '🅛', m: '🅜', n: '🅝',
        o: '🅞', p: '🅟', q: '🅠', r: '🅡', s: '🅢', t: '🅣', u: '🅤',
        v: '🅥', w: '🅦', x: '🅧', y: '🅨', z: '🅩',
        0: '⓿', 1: '➊', 2: '➋', 3: '➌', 4: '➍',
        5: '➎', 6: '➏', 7: '➐', 8: '➑', 9: '➒',
        ' ': '―'
    };

    // Procesar el texto de reacción
    const reactionText = args.slice(1).join(' ').toLowerCase();
    const emojiReaction = reactionText.split('').map(c => styleMap[c] || c).join('');

    try {
        // Obtener metadatos del canal
        const channelInfo = await conn.newsletterMetadata("invite", channelId);
        if (!channelInfo) {
            return m.reply("❌ No se pudo obtener información del canal. Verifica que el enlace sea correcto.");
        }

        // Enviar reacción
        await conn.newsletterReactMessage(channelInfo.id, messageId, emojiReaction);

        return m.reply(`✅ Reacción *${emojiReaction}* enviada correctamente al mensaje en el canal *${channelInfo.name}*`);
    } catch (error) {
        console.error('Error en chReact:', error);
        
        // Manejo de errores específicos
        if (error.message.includes('not found')) {
            return m.reply("❌ El canal o mensaje no fue encontrado. Verifica que:\n1. El enlace sea correcto\n2. Tengas acceso al canal\n3. El mensaje aún exista");
        }
        if (error.message.includes('react')) {
            return m.reply("❌ Error al enviar la reacción. ¿Tienes permiso para reaccionar en este canal?");
        }
        
        return m.reply("❌ Ocurrió un error inesperado. Por favor intenta nuevamente.");
    }
};

handler.help = ['chReact <enlace_canal> <texto>'];
handler.tags = ['channel'];
handler.command = /^(channelreact|chreact)$/i;
handler.group = false;
handler.admin = false;

export default handler;
