import fetch from "node-fetch";
import fs from "fs/promises";

export async function before(m, { conn, participants, groupMetadata }) {
  const bot = global.db.data.settings[conn.user.jid];

  // Configuraciones globales
  global.botname = global.db.data.settings[conn.user.jid]?.botName || global.bottname || "=͟͟͞❀ sᥙmі - sᥲkᥙrᥲsᥲᥕᥲ  ⏤͟͟͞͞★";
  global.textbot = `${global.botname} Powered by ${conn.getName(conn.user.jid)}` || global.textobot;
  global.welcom1 = bot?.welcome || global.welcomm1 || "¡Bienvenido al grupo!";
  global.welcom2 = bot?.bye || global.welcomm2 || "¡Adiós! Esperamos verte pronto.";

  const dev = "=͟͟͞❀ sᥙmі - sᥲkᥙrᥲsᥲᥕᥲ  ⏤͟͟͞͞★";

  if (!m.messageStubType || !m.isGroup) return !0;

  // Obtener imagen de perfil con manejo de errores
  let img;
  try {
    const pp = bot?.logo?.welcome || await conn.profilePictureUrl(m.messageStubParameters[0], "image").catch(() => null);
    img = pp ? await (await fetch(pp)).buffer() : await fs.readFile("./media/avatar.jpg");
  } catch (e) {
    console.error("Error al obtener imagen de perfil:", e);
    img = await fs.readFile("./media/avatar.jpg");
  }

  const chat = global.db.data.chats[m.chat];
  let groupSize = participants.length;

  if (m.messageStubType == 27) { // Nuevo miembro
    groupSize++;
  } else if (m.messageStubType == 28 || m.messageStubType == 32) { // Miembro sale
    groupSize--;
  }

  // Mensaje de bienvenida
  if (chat.welcome && m.messageStubType == 27) {
    const mention = m.messageStubParameters[0];
    const username = mention.split("@")[0];
    const bienvenida = bot?.welcome || 
      `❀ *Bienvenido* a ${groupMetadata.subject}\n` +
      `✰ @${username}\n` +
      `${global.welcom1}\n` +
      `✦ Ahora somos ${groupSize} Miembros.\n` +
      `•(=^●ω●^=)• Disfruta tu estadía en el grupo!\n` +
      `> ✐ Puedes usar *#help* para ver la lista de comandos.`;

    await conn.sendMessage(m.chat, {
      image: img,
      caption: bienvenida,
      mentions: [mention]
    });
  }

  // Mensaje de despedida
  if (chat.welcome && (m.messageStubType == 28 || m.messageStubType == 32)) {
    const mention = m.messageStubParameters[0];
    const username = mention.split("@")[0];
    const bye = bot?.bye || 
      `❀ *Adiós* de ${groupMetadata.subject}\n` +
      `✰ @${username}\n` +
      `${global.welcom2}\n` +
      `✦ Ahora somos ${groupSize} Miembros.\n` +
      `•(=^●ω●^=)• Te esperamos pronto!\n` +
      `> ✐ Puedes usar *#help* para ver la lista de comandos.`;

    await conn.sendMessage(m.chat, {
      image: img,
      caption: bye,
      mentions: [mention]
    });
  }
}
