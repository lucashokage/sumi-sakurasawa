import axios from "axios"
import { lookup } from "country-code-lookup"

const countryCache = new Map()

export async function getCountryFromNumber(phoneNumber) {
  try {
    if (countryCache.has(phoneNumber)) {
      return countryCache.get(phoneNumber)
    }

    const cleanNumber = phoneNumber.replace(/[^\d]/g, "")

    if (cleanNumber.startsWith("1")) return "Estados Unidos"
    if (cleanNumber.startsWith("52")) return "México"
    if (cleanNumber.startsWith("51")) return "Perú"
    if (cleanNumber.startsWith("57")) return "Colombia"
    if (cleanNumber.startsWith("56")) return "Chile"
    if (cleanNumber.startsWith("54")) return "Argentina"
    if (cleanNumber.startsWith("591")) return "Bolivia"
    if (cleanNumber.startsWith("593")) return "Ecuador"
    if (cleanNumber.startsWith("595")) return "Paraguay"
    if (cleanNumber.startsWith("598")) return "Uruguay"
    if (cleanNumber.startsWith("58")) return "Venezuela"
    if (cleanNumber.startsWith("34")) return "España"

    try {
      const response = await axios.get(`https://ipapi.co/${cleanNumber}/country_name/`)
      if (response.data && typeof response.data === "string" && !response.data.includes("Error")) {
        countryCache.set(phoneNumber, response.data)
        return response.data
      }
    } catch (e) {}

    for (let i = 1; i <= 3; i++) {
      const countryCode = cleanNumber.substring(0, i)
      try {
        const country = lookup.byPhone("+" + countryCode)
        if (country) {
          countryCache.set(phoneNumber, country.country)
          return country.country
        }
      } catch (e) {}
    }

    return "Desconocido"
  } catch (error) {
    return "Desconocido"
  }
}

export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
