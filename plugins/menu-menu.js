import { getCountryFromNumber } from "./paises.js"

async function generateMenu(m, conn) {
  try {
    const user = global.db.data.users[m.sender] || {}
    const username = user.name || m.pushName || "Usuario"
    const pluginsCount = Object.keys(global.plugins || {}).length
    const botType = user.isbebot ? "subbot" : "official"
    const displayBotName = botType === "official" ? "✦⏤͟͟͞͞ sumi sakurasawa ⏤͟͟͞͞✦" : user.namebebot || "subBot"
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

    const country = await getCountryFromNumber(m.sender.split("@")[0])
    const usersCount = Object.keys(global.db.data.users).length

    let menu = `ׄ    ִ ⏝︶ ׄ   ⋆   ׄ ︶⏝ ִ    ׄ  

> _Hola @${m.sender.split("@")[0]}, bienvenido/a al menú de @${displayBotName}_

╭┈ ↷
│➮ *Tipo ›* ${botType === "official" ? "prem Bot🅢" : "subBot"} 
│✧ *Versión ›* ^1.0.0
│❖ *Plugins ›* ${pluginsCount}
│
│• *Fecha ›* ${currentDate}
│• *Pais ›* ${country}
│• *Usuarios ›* ${usersCount.toLocaleString()}
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

    return menu
  } catch (error) {
    console.error("Error al generar el menú:", error)
    return "❌ Ocurrió un error al generar el menú. Por favor, inténtalo de nuevo."
  }
}

function generateSection(title, commands) {
  let section = `

╭ׅ╶͜─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜  ❀ *${title}* ❀  ִ.`

  commands.forEach((cmd) => {
    section += `
┃✿ᩧ̼ ❫❯ *${cmd.cmd}*
> ${cmd.desc}`
  })

  section += `
╰ׅ─ׄ֟፝͜─ׄ͜─ׄ͜╴  ֢ ⋱࣭ ᩴ   ⋮֔    ᩴ ⋰ ֢ ─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴╯ׅ`

  return section
}

export default generateMenu
