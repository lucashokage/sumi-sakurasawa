import "./config.js"
import { createRequire } from "module"
import path, { join } from "path"
import { fileURLToPath, pathToFileURL } from "url"
import { platform } from "process"
import * as ws from "ws"
import { readdirSync, statSync, unlinkSync, existsSync, readFileSync, watch } from "fs"
import yargs from "yargs"
import { spawn } from "child_process"
import lodash from "lodash"
import chalk from "chalk"
import syntaxerror from "syntax-error"
import { tmpdir } from "os"
import { format } from "util"
import { makeWASocket, protoType, serialize } from "./lib/simple.js"
import { Low, JSONFile } from "lowdb"
import pino from "pino"
import { mongoDB, mongoDBV2 } from "./lib/mongoDB.js"
import store from "./lib/store.js"
import { EventEmitter } from "events"
import got from "got"

EventEmitter.defaultMaxListeners = 25

const DEBUG_MODE = true
if (DEBUG_MODE) {
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason)
  })
  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error)
  })
}

class cloudDBAdapter {
  constructor(url, { serialize = JSON.stringify, deserialize = JSON.parse, fetchOptions = {} } = {}) {
    this.url = url
    this.serialize = serialize
    this.deserialize = deserialize
    this.fetchOptions = fetchOptions
  }

  async read() {
    try {
      const res = await got(this.url, {
        method: "GET",
        headers: {
          Accept: "application/json;q=0.9,text/plain",
        },
        ...this.fetchOptions,
      })
      if (res.statusCode !== 200) throw res.statusMessage
      return this.deserialize(res.body)
    } catch (e) {
      console.error("Error reading from cloud DB:", e.message)
      return null
    }
  }

  async write(obj) {
    try {
      const res = await got(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        ...this.fetchOptions,
        body: this.serialize(obj),
      })
      if (res.statusCode !== 200) throw res.statusMessage
      return res.body
    } catch (e) {
      console.error("Error writing to cloud DB:", e.message)
      throw e
    }
  }
}

const {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  jidNormalizedUser,
  PHONENUMBER_MCC,
} = await import("@whiskeysockets/baileys")

let COUNTRY_CODES
try {
  const countryCodesPath = join(path.dirname(fileURLToPath(import.meta.url)), "country-codes.json")
  COUNTRY_CODES = JSON.parse(readFileSync(countryCodesPath, "utf8"))
} catch (error) {
  console.error("Error al cargar country-codes.json:", error)
  COUNTRY_CODES = {}
}

const phoneMCC = COUNTRY_CODES
import NodeCache from "node-cache"
import readline from "readline"
import fs from "fs"

const { CONNECTING } = ws
const { chain } = lodash
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

protoType()
serialize()

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== "win32") {
  return rmPrefix ? (/file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL) : pathToFileURL(pathURL).toString()
}

global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true))
}

global.__require = function require(dir = import.meta.url) {
  return createRequire(dir)
}

global.API = (name, path = "/", query = {}, apikeyqueryname) =>
  (name in global.APIs ? global.APIs[name] : name) +
  path +
  (query || apikeyqueryname
    ? "?" +
      new URLSearchParams(
        Object.entries({
          ...query,
          ...(apikeyqueryname
            ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] }
            : {}),
        }),
      )
    : "")

global.timestamp = {
  start: new Date(),
}

const __dirname = global.__dirname(import.meta.url)

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp(
  "^[" + (global.opts["prefix"] || "‎z/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.,\\-").replace(/[|\\{}()[\]^$+*?.\-^]/g, "\\$&") + "]",
)

global.db = new Low(
  /https?:\/\//.test(global.opts["db"] || "")
    ? new cloudDBAdapter(global.opts["db"])
    : /mongodb(\+srv)?:\/\//i.test(global.opts["db"])
      ? global.opts["mongodbv2"]
        ? new mongoDBV2(global.opts["db"])
        : new mongoDB(global.opts["db"])
      : new JSONFile(`${global.opts._[0] ? global.opts._[0] + "_" : ""}database.json`),
)

global.DATABASE = global.db

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ)
    return new Promise((resolve) =>
      setInterval(async function () {
        if (!global.db.READ) {
          clearInterval(this)
          resolve(global.db.data == null ? global.loadDatabase() : global.db.data)
        }
      }, 1 * 1000),
    )
  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read().catch(console.error)
  global.db.READ = null
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    ...(global.db.data || {}),
  }
  global.db.chain = chain(global.db.data)
}

loadDatabase()

async function checkAndFixSession() {
  try {
    if (fs.existsSync(`./${global.authFile}/creds.json`)) {
      try {
        const credsFile = fs.readFileSync(`./${global.authFile}/creds.json`, "utf8")
        JSON.parse(credsFile)
        console.log("✅ Archivo de credenciales válido")
      } catch (e) {
        console.log("❌ Archivo de credenciales corrupto, eliminando...")
        if (!fs.existsSync(`./${global.authFile}/backup`)) {
          fs.mkdirSync(`./${global.authFile}/backup`, { recursive: true })
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        fs.renameSync(
          `./${global.authFile}/creds.json`,
          `./${global.authFile}/backup/creds-corrupted-${timestamp}.json`,
        )
        return false
      }
    }

    if (fs.existsSync(`./${global.authFile}`)) {
      const files = fs.readdirSync(`./${global.authFile}`)
      if (files.length === 0 || !files.includes("creds.json")) {
        console.log("⚠️ Directorio de sesión incompleto")
        return false
      }
    } else {
      fs.mkdirSync(`./${global.authFile}`, { recursive: true })
    }

    return true
  } catch (error) {
    console.error("Error al verificar la sesión:", error)
    return false
  }
}

global.authFile = `sessions`
const sessionValid = await checkAndFixSession()
if (!sessionValid) {
  console.log("🔄 Iniciando nuevo proceso de autenticación")
  if (fs.existsSync(`./${global.authFile}`)) {
    const files = fs.readdirSync(`./${global.authFile}`)
    for (const file of files) {
      if (file !== "backup") {
        try {
          fs.unlinkSync(`./${global.authFile}/${file}`)
        } catch (e) {
          console.error("Error al eliminar archivo:", e)
        }
      }
    }
  }
}

const { state, saveState, saveCreds } = await useMultiFileAuthState(global.authFile)
const msgRetryCounterMap = new Map()
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
const { version } = await fetchLatestBaileysVersion()
const phoneNumber = global.botNumber?.[0]

const methodCodeQR = process.argv.includes("qr")
const methodCode = !!phoneNumber || process.argv.includes("code")
const MethodMobile = process.argv.includes("mobile")

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

let opcion
if (methodCodeQR) {
  opcion = "1"
}
if (!methodCodeQR && !methodCode && !fs.existsSync(`./${global.authFile}/creds.json`)) {
  do {
    opcion = await question(
      "\n\n\n✳️ Ingrese el metodo de conexion\n\n\n🔺 1 : por código  QR\n🔺 2 : por CÓDIGO de 8 dígitos\n\n\n\n",
    )
    if (!/^[1-2]$/.test(opcion)) {
      console.log("\n\n🔴 Ingrese solo una opción \n\n 1 o 2\n\n")
    }
  } while ((opcion !== "1" && opcion !== "2") || fs.existsSync(`./${global.authFile}/creds.json`))
}

console.info = () => {}

const connectionOptions = {
  logger: pino({ level: "silent" }),
  printQRInTerminal: opcion === "1" || methodCodeQR,
  mobile: MethodMobile,
  browser:
    opcion === "1"
      ? ["Senna", "Safari", "2.0.0"]
      : methodCodeQR
        ? ["Senna", "Safari", "2.0.0"]
        : ["Ubuntu", "Chrome", "20.0.04"],
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
  },
  waWebSocketUrl: "wss://web.whatsapp.com/ws/chat",
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: true,
  getMessage: async (key) => {
    const jid = jidNormalizedUser(key.remoteJid)
    const msg = await store.loadMessage(jid, key.id)
    return msg?.message || ""
  },
  msgRetryCounterCache: msgRetryCounterCache,
  userDevicesCache: userDevicesCache,
  defaultQueryTimeoutMs: undefined,
  cachedGroupMetadata: (jid) => global.conn?.chats[jid] ?? {},
  version: [2, 3000, 1015901307],
}

async function startBot() {
  try {
    global.conn = makeWASocket(connectionOptions)

    global.conn.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (connection) {
        console.log("Estado de conexión:", connection)
      }

      if (connection === "close") {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
        console.log("Conexión cerrada debido a:", lastDisconnect?.error?.message || "Razón desconocida")

        if (shouldReconnect) {
          console.log("Reconectando...")
          await startBot()
        } else {
          console.log("No se reconectará.")
        }
      }

      if (connection === "open") {
        console.log("✅ Bot conectado correctamente!")
        if (global.db.data == null) await loadDatabase()
      }

      if (qr) {
        console.log("Nuevo QR generado, escanea con la app de WhatsApp")
      }
    })

    global.conn.ev.on("creds.update", saveCreds)

    return global.conn
  } catch (error) {
    console.error("Error al iniciar el bot:", error)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    return startBot()
  }
}

async function requestPairingCode(phoneNumber) {
  if (!phoneNumber) {
    console.error("❌ Número de teléfono no proporcionado")
    return null
  }

  try {
    console.log(`🔄 Solicitando código de emparejamiento para ${phoneNumber}...`)
    await new Promise((resolve) => setTimeout(resolve, 3000))

    let codeBot = null
    let attempts = 0
    const maxAttempts = 3

    while (!codeBot && attempts < maxAttempts) {
      attempts++
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout requesting pairing code")), 15000),
        )

        const codePromise = global.conn.requestPairingCode(phoneNumber)
        codeBot = await Promise.race([codePromise, timeoutPromise])

        if (codeBot) {
          console.log(`✅ Código obtenido en intento ${attempts}`)
        }
      } catch (error) {
        console.error(`❌ Error en intento ${attempts}:`, error.message)

        if (attempts < maxAttempts) {
          console.log(`🔄 Reintentando en 5 segundos...`)
          await new Promise((resolve) => setTimeout(resolve, 5000))
        }
      }
    }

    if (!codeBot) {
      throw new Error(`No se pudo obtener el código después de ${maxAttempts} intentos`)
    }

    return codeBot?.match(/.{1,4}/g)?.join("-") || codeBot
  } catch (error) {
    console.error("❌ Error al solicitar código de emparejamiento:", error)
    return null
  }
}

await startBot()

if (!fs.existsSync(`./${global.authFile}/creds.json`)) {
  if (opcion === "2" || methodCode) {
    opcion = "2"
    if (!global.conn.authState.creds.registered) {
      if (MethodMobile) throw new Error("⚠️ Se produjo un Error en la API de movil")

      let addNumber
      if (!!phoneNumber) {
        addNumber = phoneNumber.replace(/[^0-9]/g, "")
        if (!Object.keys(phoneMCC).some((v) => addNumber.startsWith(v))) {
          console.log(chalk.bgBlack(chalk.bold.redBright("\n\n✴️ Su número debe comenzar con el codigo de pais")))
          process.exit(0)
        }
      } else {
        while (true) {
          addNumber = await question(
            chalk.bgBlack(chalk.bold.greenBright("\n\n✳️ Escriba su numero\n\nEjemplo: 5491168xxxx\n\n")),
          )
          addNumber = addNumber.replace(/[^0-9]/g, "")

          if (addNumber.match(/^\d+$/) && Object.keys(phoneMCC).some((v) => addNumber.startsWith(v))) {
            break
          } else {
            console.log(chalk.bgBlack(chalk.bold.redBright("\n\n✴️ Asegúrese de agregar el código de país")))
          }
        }
        rl.close()
      }

      setTimeout(async () => {
        try {
          const codeBot = await requestPairingCode(addNumber)

          if (codeBot) {
            console.log(chalk.yellow("\n\n🍏 Introduce el código en WhatsApp:"))
            console.log(chalk.black(chalk.bgGreen(`\n🟣 Su Código es: `)), chalk.black(chalk.red(codeBot)))

            let reminderCount = 0
            const reminderInterval = setInterval(() => {
              reminderCount++
              if (reminderCount > 5) {
                clearInterval(reminderInterval)
                return
              }
              console.log(chalk.yellow(`\n⏳ Recuerda introducir el código: ${codeBot}`))
            }, 30000)
          } else {
            console.error("❌ No se pudo generar el código de emparejamiento")
          }
        } catch (error) {
          console.error("❌ Error en el proceso de emparejamiento:", error)
        }
      }, 3000)
    }
  }
}

global.conn.isInit = false

if (!global.opts["test"]) {
  setInterval(async () => {
    if (global.db.data) await global.db.write().catch(console.error)
    if (global.opts["autocleartmp"])
      try {
        clearTmp()
      } catch (e) {
        console.error(e)
      }
  }, 60 * 1000)
}

if (global.opts["server"]) (await import("./server.js")).default(global.conn, PORT)

async function clearTmp() {
  const tmp = [tmpdir(), join(__dirname, "./tmp")]
  const filename = []
  tmp.forEach((dirname) => readdirSync(dirname).forEach((file) => filename.push(join(dirname, file))))

  return filename.map((file) => {
    const stats = statSync(file)
    if (stats.isFile() && Date.now() - stats.mtimeMs >= 1000 * 60 * 1) return unlinkSync(file)
    return false
  })
}

setInterval(async () => {
  await clearTmp()
}, 60000)

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin } = update
  if (isNewLogin) global.conn.isInit = true
  const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
  if (code && code !== DisconnectReason.loggedOut && global.conn?.ws.socket == null) {
    console.log(await global.reloadHandler(true).catch(console.error))
    global.timestamp.connect = new Date()
  }

  if (global.db.data == null) loadDatabase()
}

process.on("uncaughtException", console.error)

let isInit = true
let handler = await import("./handler.js")

global.reloadHandler = async (restartConn) => {
  try {
    if (global.conn.ev) {
      global.conn.ev.removeAllListeners("messages.upsert")
      global.conn.ev.removeAllListeners("group-participants.update")
      global.conn.ev.removeAllListeners("groups.update")
      global.conn.ev.removeAllListeners("message.delete")
      global.conn.ev.removeAllListeners("connection.update")
      global.conn.ev.removeAllListeners("creds.update")
    }

    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error)
    if (Object.keys(Handler || {}).length) {
      handler = Handler
    }

    if (restartConn) {
      const oldChats = global.conn.chats
      try {
        global.conn.ws.close()
      } catch (e) {
        console.error(e)
      }
      global.conn = makeWASocket(connectionOptions, { chats: oldChats })
      isInit = true
    }

    const setupHandler = (eventName, handlerName) => {
      if (handler[handlerName] && typeof handler[handlerName] === "function") {
        global.conn[handlerName] = handler[handlerName].bind(global.conn)
        if (global.conn.ev && global.conn.ev.on) {
          global.conn.ev.on(eventName, global.conn[handlerName])
        } else {
          console.warn("global.conn.ev or global.conn.ev.on is undefined. Event listener not attached.")
        }
        return true
      }
      global.conn[handlerName] = () => {}
      if (global.conn.ev && global.conn.ev.on) {
        global.conn.ev.on(eventName, global.conn[handlerName])
      } else {
        console.warn("global.conn.ev or global.conn.ev.on is undefined. Event listener not attached.")
      }
      console.log(`Handler ${handlerName} no encontrado o no es una función, usando handler vacío por defecto`)
      return false
    }

    setupHandler("messages.upsert", "handler")
    setupHandler("group-participants.update", "participantsUpdate")
    setupHandler("groups.update", "groupsUpdate")
    setupHandler("message.delete", "deleteUpdate")

    global.conn.connectionUpdate = connectionUpdate.bind(global.conn)
    global.conn.credsUpdate = saveCreds.bind(global.conn, true)

    global.conn.ev.on("connection.update", global.conn.connectionUpdate)
    global.conn.ev.on("creds.update", global.conn.credsUpdate)

    isInit = false
    return true
  } catch (e) {
    console.error("Error en reloadHandler:", e)
    return false
  }
}

global.conn.welcome = "Hola, @user\nBienvenido a @group"
global.conn.bye = "adiós @user"
global.conn.spromote = "@user promovió a admin"
global.conn.sdemote = "@user degradado"
global.conn.sDesc = "La descripción ha sido cambiada a \n@desc"
global.conn.sSubject = "El nombre del grupo ha sido cambiado a \n@group"
global.conn.sIcon = "El icono del grupo ha sido cambiado"
global.conn.sRevoke = "El enlace del grupo ha sido cambiado a \n@revoke"

const pluginFolder = global.__dirname(join(__dirname, "./plugins/index"))
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}

async function filesInit() {
  for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = global.__filename(join(pluginFolder, filename))
      const module = await import(file)
      global.plugins[filename] = module.default || module
    } catch (e) {
      global.conn.logger.error(e)
      delete global.plugins[filename]
    }
  }
}

filesInit()
  .then((_) => console.log(Object.keys(global.plugins)))
  .catch(console.error)

global.reload = async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true)
    if (filename in global.plugins) {
      if (existsSync(dir)) global.conn.logger.info(`🌟 Plugin Actualizado - '${filename}'`)
      else {
        global.conn.logger.warn(`🗑️ Plugin Eliminado - '${filename}'`)
        return delete global.plugins[filename]
      }
    } else global.conn.logger.info(`✨ Nuevo plugin - '${filename}'`)

    const err = syntaxerror(readFileSync(dir), filename, {
      sourceType: "module",
      allowAwaitOutsideFunction: true,
    })

    if (err) global.conn.logger.error(`syntax error while loading '${filename}'\n${format(err)}`)
    else
      try {
        const module = await import(`${global.__filename(dir)}?update=${Date.now()}`)
        global.plugins[filename] = module.default || module
      } catch (e) {
        global.conn.logger.error(`error require plugin '${filename}\n${format(e)}'`)
      } finally {
        global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)))
      }
  }
}

Object.freeze(global.reload)
watch(pluginFolder, global.reload)
await global.reloadHandler()

function logBotState() {
  console.info("📊 Estado del bot:")
  console.info(
    `- Memoria: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB / ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
  )

  if (global.conn) {
    console.info(`- Conexión: ${global.conn.user ? "Conectado como " + global.conn.user.name : "No conectado"}`)
    console.info(`- Chats: ${Object.keys(global.conn.chats || {}).length}`)
  } else {
    console.info("- Conexión: No iniciada")
  }

  if (global.db?.data) {
    console.info(`- Base de datos: Cargada (Usuarios: ${Object.keys(global.db.data.users || {}).length})`)
  } else {
    console.info("- Base de datos: No cargada")
  }
}

setInterval(logBotState, 300000)

async function _quickTest() {
  const test = await Promise.all(
    [
      spawn("ffmpeg"),
      spawn("ffprobe"),
      spawn("ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-filter_complex",
        "color",
        "-frames:v",
        "1",
        "-f",
        "webp",
        "-",
      ]),
      spawn("convert"),
      spawn("magick"),
      spawn("gm"),
      spawn("find", ["--version"]),
    ].map((p) => {
      return Promise.race([
        new Promise((resolve) => {
          p.on("close", (code) => {
            resolve(code !== 127)
          })
        }),
        new Promise((resolve) => {
          p.on("error", (_) => resolve(false))
        }),
      ])
    }),
  )

  const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test
  console.log(test)
  const s = (global.support = {
    ffmpeg,
    ffprobe,
    ffmpegWebp,
    convert,
    magick,
    gm,
    find,
  })

  Object.freeze(global.support)

  if (!s.ffmpeg) global.conn.logger.warn("Please install ffmpeg for sending videos (pkg install ffmpeg)")
  if (s.ffmpeg && !s.ffmpegWebp)
    global.conn.logger.warn(
      "Stickers may not animated without libwebp on ffmpeg (--enable-ibwebp while compiling ffmpeg)",
    )
  if (!s.convert && !s.magick && !s.gm)
    global.conn.logger.warn(
      "Stickers may not work without imagemagick if libwebp on ffmpeg doesnt isntalled (pkg install imagemagick)",
    )
}

_quickTest()
  .then(() => global.conn.logger.info("✅ Prueba rápida realizado!"))
  .catch(console.error)
