const Reg = /\|?(.*)([.|] *?)([0-9]*)$/i

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
  const mentionedJid = [who]
  const pp = await conn.profilePictureUrl(who, "image").catch((_) => "https://files.catbox.moe/xr2m6u.jpg")
  const user = global.db.data.users[m.sender]
  const name2 = conn.getName(m.sender)

  if (user.registered === true)
    return m.reply(
      `《✧》Ya estás registrado.\n\n*¿Quiere volver a registrarse?*\n\nUse este comando para eliminar su registro.\n*${usedPrefix}unreg*`,
    )
  if (!Reg.test(text))
    return m.reply(
      `《✧》Formato incorrecto.\n\nUso del comamdo: *${usedPrefix + command} nombre.edad*\nEjemplo : *${usedPrefix + command} ${name2}.18*`,
    )

  let [_, name, splitter, age] = text.match(Reg)
  if (!name) return m.reply(`《✧》El nombre no puede estar vacío.`)
  if (!age) return m.reply(`《✧》La edad no puede estar vacía.`)
  if (name.length >= 100) return m.reply(`《✧》El nombre es demasiado largo.`)

  age = Number.parseInt(age)
  if (age > 1000) return m.reply(`《✧》Wow el abuelo quiere jugar al bot.`)
  if (age < 5) return m.reply(`《✧》hay un abuelo bebé jsjsj.`)

  user.name = name + "✓".trim()
  user.age = age
  user.regTime = +new Date()
  user.registered = true

  const coinReward = 40
  const expReward = 300
  const tokenReward = 20

  global.db.data.users[m.sender].coin += coinReward
  global.db.data.users[m.sender].exp += expReward
  global.db.data.users[m.sender].joincount += tokenReward

  const textbot = "✧ Gracias por registrarte ✧"
  const channel = "https://whatsapp.com/channel/0029VaFVSkRCMY0KFmCMDX2q"
  const dev = "✧ Desarrollado por @The-King-Destroy"

  let regbot = `❀ 𝗥 𝗘 𝗚 𝗜 𝗦 𝗧 𝗥 𝗔 𝗗 𝗢 ❀\n`
  regbot += `•┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄•\n`
  regbot += `> ❀ Nombre » ${name}\n`
  regbot += `> ✎ Edad » ${age} años\n`
  regbot += `•┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄•\n`
  regbot += `❀ 𝗥𝗲𝗰𝗼𝗺𝗽𝗲𝗻𝘀𝗮𝘀:\n`
  regbot += `> • ⛁ *Coin* » ${coinReward}\n`
  regbot += `> • ✰ *Experiencia* » ${expReward}\n`
  regbot += `> • ❖ *Tokens* » ${tokenReward}\n`
  regbot += `•┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄•\n`
  regbot += `> ${dev}`

  await m.react("📩")

  await conn.sendMessage(
    m.chat,
    {
      text: regbot,
      contextInfo: {
        externalAdReply: {
          title: "✧ Usuario Verificado ✧",
          body: textbot,
          thumbnailUrl: pp,
          sourceUrl: channel,
          mediaType: 1,
          showAdAttribution: true,
          renderLargerThumbnail: true,
        },
      },
    },
    { quoted: m },
  )
}

handler.help = ["reg"]
handler.tags = ["rg"]
handler.command = ["verify", "verificar", "reg", "register", "registrar"]

export default handler
