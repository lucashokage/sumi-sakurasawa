const handler = async (m, { conn, args }) => {
    // Verificación básica de argumentos
    if (!args || args.length < 2) {
        return m.reply(`Ejemplo de uso:\n.chReact https://whatsapp.com/channel/xxxx "texto de reacción"`);
    }

    // Validación del enlace del canal
    const validLinkPatterns = [
        /^https:\/\/whatsapp\.com\/channel\/[A-Z0-9]{22}$/i,
        /^https:\/\/whatsapp\.com\/channel\/[A-Z0-9]{22}\/[A-Z0-9]+$/i
    ];
    
    const isValidLink = validLinkPatterns.some(pattern => pattern.test(args[0]));
    if (!isValidLink) {
        return m.reply("Enlace no válido. Debe ser un enlace de canal de WhatsApp válido.");
    }

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
        // Extraer información del enlace
        const urlParts = args[0].split('/');
        const channelId = urlParts[4];
        const messageId = urlParts[5] || null; // Manejar caso sin messageId

        // Obtener metadatos del canal
        const channelInfo = await conn.newsletterMetadata("invite", channelId);
        if (!channelInfo) {
            return m.reply("No se pudo obtener información del canal.");
        }

        // Verificar si el mensaje existe
        if (!messageId) {
            return m.reply("El enlace debe incluir el ID del mensaje.");
        }

        // Enviar reacción
        await conn.newsletterReactMessage(channelInfo.id, messageId, emojiReaction);

        return m.reply(`✅ Reacción *${emojiReaction}* enviada correctamente al mensaje en el canal *${channelInfo.name}*.`);
    } catch (error) {
        console.error('Error en chReact:', error);
        
        // Manejo de errores específicos
        if (error.message.includes('not found')) {
            return m.reply("El canal o mensaje no fue encontrado. Verifica el enlace.");
        }
        if (error.message.includes('react')) {
            return m.reply("Error al enviar la reacción. ¿Tienes permiso para reaccionar?");
        }
        
        return m.reply("Ocurrió un error inesperado. Por favor intenta nuevamente.");
    }
};

handler.help = ['chReact <enlace_canal> <texto>'];
handler.tags = ['channel'];
handler.command = /^(channelreact|chreact)$/i;
handler.group = false; // Solo funciona en chats privados
handler.admin = false; // No requiere privilegios admin

export default handler;
