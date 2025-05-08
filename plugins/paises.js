const countryCache = new Map()

export async function getCountryFromNumber(phoneNumber) {
  try {
    if (countryCache.has(phoneNumber)) {
      return countryCache.get(phoneNumber)
    }

    const cleanNumber = phoneNumber.replace(/[^\d]/g, "")
    
    // Mapeo directo de códigos de país
    const countryCodes = {
      "1": "Estados Unidos",
      "52": "México",
      "51": "Perú",
      "57": "Colombia",
      "56": "Chile",
      "54": "Argentina",
      "591": "Bolivia",
      "593": "Ecuador",
      "595": "Paraguay",
      "598": "Uruguay",
      "58": "Venezuela",
      "34": "España",
      "55": "Brasil",
      "502": "Guatemala",
      "503": "El Salvador",
      "504": "Honduras",
      "505": "Nicaragua",
      "506": "Costa Rica",
      "507": "Panamá",
      "809": "República Dominicana",
      "1787": "Puerto Rico",
      "53": "Cuba",
      "49": "Alemania",
      "33": "Francia",
      "44": "Reino Unido",
      "39": "Italia",
      "351": "Portugal",
      "7": "Rusia",
      "81": "Japón",
      "86": "China",
      "91": "India",
      "62": "Indonesia",
      "60": "Malasia",
      "65": "Singapur",
      "66": "Tailandia",
      "84": "Vietnam",
      "61": "Australia",
      "64": "Nueva Zelanda",
      "27": "Sudáfrica",
      "20": "Egipto",
      "212": "Marruecos",
      "234": "Nigeria",
      "254": "Kenia",
      "971": "Emiratos Árabes Unidos",
      "966": "Arabia Saudita",
      "90": "Turquía",
      "92": "Pakistán",
      "880": "Bangladesh"
    }

    // Comprobar códigos de 3 dígitos primero
    for (const [code, country] of Object.entries(countryCodes)) {
      if (code.length === 3 && cleanNumber.startsWith(code)) {
        countryCache.set(phoneNumber, country)
        return country
      }
    }
    
    // Luego comprobar códigos de 2 dígitos
    for (const [code, country] of Object.entries(countryCodes)) {
      if (code.length === 2 && cleanNumber.startsWith(code)) {
        countryCache.set(phoneNumber, country)
        return country
      }
    }
    
    // Finalmente comprobar códigos de 1 dígito
    for (const [code, country] of Object.entries(countryCodes)) {
      if (code.length === 1 && cleanNumber.startsWith(code)) {
        countryCache.set(phoneNumber, country)
        return country
      }
    }

    return "Desconocido"
  } catch (error) {
    return "Desconocido"
  }
}

export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
