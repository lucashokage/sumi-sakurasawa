import { createRequire } from "module"
import { fileURLToPath } from "url"
import path from "path"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

const PHONENUMBER_MCC = JSON.parse(fs.readFileSync(path.join(__dirname, "./country-codes.json"), "utf8"))

export function validatePhoneNumber(addNumber) {
  addNumber = addNumber.replace(/[^0-9]/g, "")
  return addNumber.match(/^\d+$/) && Object.keys(PHONENUMBER_MCC).some((v) => addNumber.startsWith(v))
}

export function getCountryCodeForPhone(phoneNumber) {
  if (!phoneNumber) return null

  const cleanNumber = phoneNumber.replace(/[^0-9]/g, "")

  for (const prefix of Object.keys(PHONENUMBER_MCC).sort((a, b) => b.length - a.length)) {
    if (cleanNumber.startsWith(prefix)) {
      return {
        prefix,
        country: PHONENUMBER_MCC[prefix],
      }
    }
  }

  return null
}
