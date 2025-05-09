import "./config.js"
import { createRequire } from "module"
import path, { join } from "path"
import { fileURLToPath, pathToFileURL } from "url"
import { platform } from "process"
import * as ws from "ws"
import { readdirSync, statSync, unlinkSync, readFileSync } from "fs"
import yargs from "yargs"
import lodash from "lodash"
import chalk from "chalk"
import { tmpdir } from "os"
import { makeWASocket, protoType, serialize } from "./lib/simple.js"
import { Low, JSONFile } from "lowdb"
import pino from "pino"
import { mongoDB, mongoDBV2 } from "./lib/mongoDB.js"
import store from "./lib/store.js"
import { EventEmitter } from "events"
import { cloudDBAdapter } from "./lib/cloudDBAdapter.js"

EventEmitter.defaultMaxListeners = 25

const {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  MessageRetryMap,
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

global.authFile = `sessions`
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

let conn
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
  cachedGroupMetadata: (jid) => global.conn.chats[jid] ?? {},
  version: [2, 3000, 1015901307],
}

global.conn = makeWASocket(connectionOptions)

if (!fs.existsSync(`./${global.authFile}/creds.json`)) {
  if (opcion === "2" || methodCode) {
    opcion = "2"
    if (!conn.authState.creds.registered) {
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
        let codeBot = await conn.requestPairingCode(addNumber)
        codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot
        console.log(chalk.yellow("\n\n🍏 introduce el código en WhatsApp."))
        console.log(chalk.black(chalk.bgGreen(`\n🟣 Su Código es: `)), chalk.black(chalk.red(codeBot)))
      }, 3000)
    }
  }
}

conn.isInit = false

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
  if (isNewLogin) conn.isInit = true
  const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
  if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
    console.log(await global.reloadHandler(true).catch(console.error))
    global.timestamp.connect = new Date()
  }

  if (global.db.data == null) loadDatabase()
}

process.on("uncaughtException", console.error)

const isInit = true
let handler = await import("./handler.js")

global.reloadHandler = async (restartConn) => {
    try {
        if (conn.ev) {
            conn.ev.removeAllListeners('messages.upsert');
            conn.ev.removeAllListeners('group-participants.update');
            conn.ev.removeAllListeners('groups.update');
            conn.ev.removeAllListeners('message.delete');
            conn.ev.removeAllListeners('connection.update');
            conn.ev.removeAllListeners('creds.update');
        }

        const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
        if (Object.keys(Handler || {}).length) {
            handler = Handler;
        }

        if (restartConn) {
            const oldChats = global.conn.chats;
            try { global.conn.ws.close(); } catch\
