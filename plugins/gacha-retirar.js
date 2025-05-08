import { promises as fs } from "fs"

const charactersFilePath = "./src/database/characters.json"
const cooldownTime = 3600000 // 1 hora

async function loadCharacters() {
  try {
    const data = await fs.readFile(charactersFilePath, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

async function saveCharacters(characters) {
  try {
    await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), "utf-8")
  } catch (error) {
    console.error("Error al guardar personajes:", error)
  }
}

const handler = async (m, { conn, args, text }) => {
  if (!text)
    return conn.reply(m.chat, "《✧》Por favor, especifica el nombre del personaje que deseas retirar del mercado.", m)

  const characterName = text.trim()
  const seller = m.sender

  try {
    const characters = await loadCharacters()
    const characterToRemove = characters.find(
      (c) => c.name.toLowerCase() === characterName.toLowerCase() && c.forSale === true && c.seller === seller,
    )

    if (!characterToRemove) {
      return conn.reply(
        m.chat,
        `《✧》No se encontró el personaje *${characterName}* en venta o no eres el vendedor.`,
        m,
      )
    }

    // Restaurar precio original y marcar como no en venta
    if (characterToRemove.previousPrice) {
      characterToRemove.value = characterToRemove.previousPrice
      delete characterToRemove.previousPrice
    }

    characterToRemove.forSale = false
    characterToRemove.lastRemovedTime = Date.now()
    delete characterToRemove.price
    delete characterToRemove.seller

    await saveCharacters(characters)

    conn.reply(
      m.chat,
      `✅ Has retirado a *${characterToRemove.name}* del mercado. Deberás esperar 1 hora antes de volver a ponerlo en venta.`,
      m,
    )
  } catch (error) {
    conn.reply(m.chat, `✘ Error al retirar el personaje: ${error.message}`, m)
  }
}

handler.help = ["retirar <nombre>"]
handler.tags = ["gacha"]
handler.command = ["retirar", "withdraw"]
handler.group = true
handler.register = true

export default handler
