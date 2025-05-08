const handler = async (m, { conn, usedPrefix, command }) => {
  try {
    // Obtener datos del usuario y del bot
    const userId = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
    const user = global.db.data.users[userId] || {}
    const name = conn.getName(userId)
    const _uptime = process.uptime() * 1000
    const uptime = clockString(_uptime)
    const totalreg = Object.keys(global.db.data.users).length
    const pluginsCount = Object.keys(global.plugins || {}).length
    const botType = user.isbebot ? "subbot" : "official"
    const displayBotName = botType === "official" ? "✦⏤͟͟͞͞ sumi sakurasawa ⏤͟͟͞͞✦" : user.namebebot || "subBot"
    const bot = global.db.data.settings[conn.user.jid] || {}

    // Obtener fecha actual
    const date = new Date()
    const options = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
    const currentDate = date.toLocaleDateString("es-ES", options)

    // Obtener país del usuario
    const country = getCountryFromNumber(m.sender.split("@")[0])

    // Construir el menú
    let menu = `ׄ    ִ ⏝︶ ׄ   ⋆   ׄ ︶⏝ ִ    ׄ  

> _Hola @${userId.split("@")[0]}, bienvenido/a al menú de @${displayBotName}_

╭┈ ↷
│➮ *Tipo ›* ${botType === "official" : "subBot"} 
│✧ *Versión ›* ^1.0.0
│❖ *Plugins ›* ${pluginsCount}
│
│• *Fecha ›* ${currentDate}
│• *Pais ›* ${country}
│• *Usuarios ›* ${totalreg.toLocaleString()}
│• *Activada ›* ${uptime}
╰╶͜─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴✧╶͜─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴✧╶͜─ׄ͜─ׄ֟፝͜

✐; *❀*→ ᴘᴀʀᴀ ᴄʀᴇᴀʀ ᴜɴ sᴜʙ-ʙᴏᴛ ᴄᴏɴ ᴛᴜ ɴᴜᴍᴇʀᴏ ᴜᴛɪʟɪᴢᴀ *#qr* o *#code*`

    menu += generateSection("SETLOGO", [
      { cmd: "#setlogo banner", desc: "cambia tu foto de menú" },
      { cmd: "#setlogo welcome", desc: "Cambia tu imagen de bienvenida" },
      { cmd: "#setname < y el texto>", desc: "cambia el nombre de tu subbot" },
      { cmd: "#setprofile", desc: "Cambia la imagen de tu perfil de whatsapp" },
    ])

    menu += generateSection("ANIME", [
      { cmd: "#hug + _<mention>_", desc: "_*Dale un abrazo a un usuario.*_" },
      { cmd: "#kill + _<mention>_", desc: "_*Asesina a un usuario.*_" },
      { cmd: "#eat › #nom › #comer + _<mention>_", desc: "_*Come algo o con un usuario.*_" },
      { cmd: "#kiss › #muak + _<mention>_", desc: "_*Dale un beso a un usuario.*_" },
      { cmd: "#wink + _<mention>_", desc: "_*Guiñale a un usuario.*_" },
    ])

    menu += generateSection("DOWNLOAD", [
      { cmd: "#facebook › #fb + _<url>_", desc: "_*Descarga videos de facebook.*_" },
      { cmd: "#instagram › #ig + _<url>_", desc: "_*Descarga videos de instagram.*_" },
      { cmd: "#tiktok › #tt + _<url|query>_", desc: "_*Descarga videos de tiktok.*_" },
      { cmd: "#kwai › #kw › #wai + _<url>_", desc: "_*Descarga videos de kwai.*_" },
      { cmd: "#play › #play2 › #mp3 › #mp4 + _<url|query>_", desc: "_*Descarga videos de youtube.*_" },
    ])

    menu += generateSection("GACHA", [
      { cmd: "#rw › #roll › #rollwaifu", desc: "_*Envia waifu aleatorios con valor.*_" },
      { cmd: "#c › #claim › #buy + _<mention waifu>_", desc: "_*Compra una waifu.*_" },
      { cmd: "#harem › #miswaifus › #claims", desc: "_*Mira tus personajes obtenidos.*_" },
    ])

    menu += generateSection("GRUPO", [
      { cmd: "#mute", desc: "_*Activa y desactiva el bot en el grupo.*_" },
      { cmd: "#promote + _<mention>_", desc: "_*Promueve a un usuario a administrador.*_" },
      { cmd: "#demote + _<mention>_", desc: "_*Degrada a un usuario de administrador.*_" },
      { cmd: "#setprimary + _<mention>_", desc: "_*Establece un bot como primario del grupo.*_" },
      { cmd: "#setgpbaner", desc: "_*Cambia la imagen del grupo.*_" },
    ])

    menu += generateSection("IA", [{ cmd: "#ia › #chatgpt + _<query>_", desc: "_*Realiza una petición a chatgpt.*_" }])

    menu += generateSection("INFO", [
      { cmd: "#menu › #help + _<category>_", desc: "_*Muestra la lista de comandos.*_" },
      { cmd: "#infobot › #infosocket", desc: "_*Muestra la información del socket.*_" },
      { cmd: "#ping › #p", desc: "_*Muestra la velocidad del Bot.*_" },
      { cmd: "#report › #reporte + _<error>_", desc: "_*Envia un mensaje de reporte al Staff.*_" },
    ])

    menu += generateSection("NSFW", [
      { cmd: "#blowjob › #bj + _<mention>_", desc: "_*Dale una mamada a un usuario.*_" },
      { cmd: "#rule34 › #r34 + _<tag>_", desc: "_*Busca imágenes nsfw en rule34*_" },
      { cmd: "#gelbooru › #gbooru › #booru + _<tag>_", desc: "_*Buscar imagenes en gelbooru*_" },
    ])

    menu += generateSection("PROFILE", [
      { cmd: "#level › #levelup", desc: "_*Muestra información de tu nivel y progreso.*_" },
      { cmd: "#marry + _<mention>_", desc: "_*Envia una solicitud de matrimonio a un usuario.*_" },
      { cmd: "#divorce", desc: "_*Divorciate de tu pareja.*_" },
      { cmd: "#profile › #perfil", desc: "_*Muestra tu perfil o la de un usuario.*_" },
    ])

    menu += generateSection("RPG", [
      { cmd: "#balance › #bal + _<mention>_", desc: "_*Muestra tu balance o la de un usuario.*_" },
      { cmd: "#steal › #rob › #robar + _<mention>_", desc: "_*Intenta robar coins a un usuario.*_" },
      { cmd: "#crime", desc: "_*Intenta cometer un crime.*_" },
      {
        cmd: "#givecoins › #pay › #coinsgive + _<cantidad|all>_ + _<mention>_",
        desc: "_*Regala coins a un usuario.*_",
      },
    ])

    menu += generateSection("UTILS", [
      { cmd: "#sticker › #s", desc: "_*Convierte imágenes o videos a stickers.*_" },
      { cmd: "#getpic › #pfp + _<mention>_", desc: "_*Ver la foto de perfil de un usuario*_" },
      { cmd: "#toimg", desc: "_*Convierte un sticker a una imagen.*_" },
      { cmd: "#tourl › #catbox", desc: "_*Convierte la imagen en un link.*_" },
    ])

    // Enviar el menú como mensaje con imagen
    await conn.sendMessage(
      m.chat,
      {
        text: menu,
        contextInfo: {
          mentionedJid: [m.sender, userId],
          isForwarded: true,
          forwardingScore: 999,
          externalAdReply: {
            title: displayBotName,
            body: "Menú de comandos",
            thumbnailUrl: bot.logo?.banner || "https://i.ibb.co/S32y0NL/banner.jpg",
            sourceUrl: "https://github.com/",
            mediaType: 1,
            showAdAttribution: true,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: m },
    )
  } catch (error) {
    console.error("Error en el comando menu:", error)
    m.reply("❌ Ocurrió un error al procesar el comando")
  }
}

// Función para generar una sección del menú
function generateSection(title, commands) {
  let section = `

»  ⊹˚୨ •(=^●ω●^=)• *${title}*  ❀

ᥫ᭡ Comandos para ${getDescriptionForSection(title)}.
─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─`

  commands.forEach((cmd) => {
    section += `
ᰔᩚ *${cmd.cmd}*
> ${cmd.desc}`
  })

  return section
}

// Función para obtener descripción de sección
function getDescriptionForSection(title) {
  const descriptions = {
    SETLOGO: "cambiar logos y nombres",
    ANIME: "interacciones de anime",
    DOWNLOAD: "descargar contenido de varias plataformas",
    GACHA: "coleccionar y gestionar waifus",
    GRUPO: "administrar grupos",
    IA: "interactuar con inteligencia artificial",
    INFO: "obtener información del bot",
    NSFW: "contenido para adultos",
    PROFILE: "gestionar tu perfil",
    RPG: "jugar y ganar monedas",
    UTILS: "herramientas útiles",
  }

  return descriptions[title] || "usar comandos diversos"
}

// Función para determinar el país basado en el código del número
function getCountryFromNumber(phoneNumber) {
  try {
    const cleanNumber = phoneNumber.replace(/[^\d]/g, "")

    // Mapeo directo de códigos de país
    const countryCodes = {
      1: "Estados Unidos",
      52: "México",
      51: "Perú",
      57: "Colombia",
      56: "Chile",
      54: "Argentina",
      591: "Bolivia",
      593: "Ecuador",
      595: "Paraguay",
      598: "Uruguay",
      58: "Venezuela",
      34: "España",
      55: "Brasil",
      502: "Guatemala",
      503: "El Salvador",
      504: "Honduras",
      505: "Nicaragua",
      506: "Costa Rica",
      507: "Panamá",
      809: "República Dominicana",
      1787: "Puerto Rico",
      53: "Cuba",
    }

    // Comprobar códigos de 3 dígitos primero
    for (const [code, country] of Object.entries(countryCodes)) {
      if (code.length === 3 && cleanNumber.startsWith(code)) {
        return country
      }
    }

    // Luego comprobar códigos de 2 dígitos
    for (const [code, country] of Object.entries(countryCodes)) {
      if (code.length === 2 && cleanNumber.startsWith(code)) {
        return country
      }
    }

    // Finalmente comprobar códigos de 1 dígito
    for (const [code, country] of Object.entries(countryCodes)) {
      if (code.length === 1 && cleanNumber.startsWith(code)) {
        return country
      }
    }

    return "Desconocido"
  } catch (error) {
    return "Desconocido"
  }
}

// Función para formatear el tiempo de actividad
function clockString(ms) {
  const seconds = Math.floor((ms / 1000) % 60)
  const minutes = Math.floor((ms / (1000 * 60)) % 60)
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
  return `${hours}h ${minutes}m ${seconds}s`
}

handler.help = ["menu", "help", "comandos"]
handler.tags = ["main"]
handler.command = /^(menu|help|comandos|cmd)$/i

export default handler
