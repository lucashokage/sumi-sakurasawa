import fs from 'fs';
import path from 'path';

var handler = async (m, { usedPrefix, command }) => {
    try {
        await m.react('🕒'); 
        conn.sendPresenceUpdate('composing', m.chat);

        const pluginsDir = './plugins';
        const files = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
        let response = `❀ *Revisión de Syntax Errors:*\n\n`;
        let hasErrors = false;

        for (const file of files) {
            try {
                await import(path.resolve(pluginsDir, file));
            } catch (error) {
                hasErrors = true;
                const errorMatch = error.stack.match(/<anonymous>:(\d+):(\d+)/) || 
                                  error.stack.match(/eval:(\d+):(\d+)/) ||
                                  error.stack.match(/(\d+):(\d+)/);
                
                let errorDetails = `✘ *Error en:* ${file}\n`;
                
                if (errorMatch && errorMatch.length >= 3) {
                    const line = errorMatch[1];
                    const column = errorMatch[2];
                    errorDetails += `📍 *Posición:* Línea ${line}, Columna ${column}\n`;
                }
                
                errorDetails += `🔍 *Error:* ${error.message}\n\n`;
                
                try {
                    const fileContent = fs.readFileSync(path.resolve(pluginsDir, file), 'utf-8').split('\n');
                    if (errorMatch && fileContent.length >= errorMatch[1]) {
                        const problemLine = fileContent[errorMatch[1] - 1].trim();
                        errorDetails += `📄 *Código:* ${problemLine}\n\n`;
                    }
                } catch (readErr) {
                    errorDetails += `\n`;
                }
                
                response += errorDetails;
            }
        }

        if (!hasErrors) {
            response += '「✐」 ¡Todo está en orden! No se detectaron errores de sintaxis.';
        }

        await conn.reply(m.chat, response, m);
        await m.react('✅');
    } catch (err) {
        await m.react('✖️'); 
        console.error(err);
        conn.reply(m.chat, '✘ *Ocurrió un fallo al verificar los plugins.*', m);
    }
};

handler.command = ['rev'];
handler.help = ['rev'];
handler.tags = ['tools'];
handler.register = true;

export default handler;
