/**
 * Služba pro získávání kurzů měn z ČNB
 * Používá oficiální API České národní banky
 */

// Cache pro kurzy (klíč = datum ve formátu YYYY-MM-DD)
const rateCache = new Map<string, number>();

/**
 * Formátuje datum pro ČNB API (DD.MM.YYYY)
 */
function formatDateForCNB(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Formátuje datum jako klíč pro cache (YYYY-MM-DD)
 */
function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parsuje odpověď z ČNB API a extrahuje kurz PLN
 * Formát: "Polsko|zlotý|1|PLN|5,892"
 */
function parseCNBResponse(text: string): number | null {
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.includes('|PLN|')) {
      const parts = line.split('|');
      if (parts.length >= 5) {
        // Kurz je v posledním sloupci, používá čárku jako desetinný oddělovač
        const rateStr = parts[4].trim().replace(',', '.');
        const rate = parseFloat(rateStr);
        if (!isNaN(rate)) {
          return rate;
        }
      }
    }
  }

  return null;
}

/**
 * Získá kurz PLN/CZK pro zadané datum z ČNB
 * Pokud kurz není dostupný (víkend, svátek), zkusí předchozí dny
 *
 * @param date Datum pro které chceme kurz
 * @param maxRetries Maximální počet pokusů (pro fallback na předchozí dny)
 * @returns Kurz PLN/CZK
 */
export async function getExchangeRate(date: Date, maxRetries = 7): Promise<number> {
  const dateKey = formatDateKey(date);

  // Zkontrolovat cache
  if (rateCache.has(dateKey)) {
    return rateCache.get(dateKey)!;
  }

  let currentDate = new Date(date);
  let attempts = 0;

  while (attempts < maxRetries) {
    const dateStr = formatDateForCNB(currentDate);
    const url = `https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt?date=${dateStr}`;

    try {
      const response = await fetch(url);

      if (response.ok) {
        const text = await response.text();
        const rate = parseCNBResponse(text);

        if (rate !== null) {
          // Uložit do cache (pro původní datum i pro datum odkud jsme kurz vzali)
          rateCache.set(dateKey, rate);
          rateCache.set(formatDateKey(currentDate), rate);
          return rate;
        }
      }
    } catch (error) {
      console.warn(`Nepodařilo se získat kurz pro ${dateStr}:`, error);
    }

    // Zkusit předchozí den
    currentDate.setDate(currentDate.getDate() - 1);
    attempts++;
  }

  // Fallback na výchozí kurz (přibližný průměr)
  console.warn(`Nepodařilo se získat kurz z ČNB, používám výchozí hodnotu`);
  const fallbackRate = 5.9; // Přibližný kurz PLN/CZK
  rateCache.set(dateKey, fallbackRate);
  return fallbackRate;
}

/**
 * Vyčistí cache kurzů
 */
export function clearRateCache(): void {
  rateCache.clear();
}

/**
 * Přidá kurz do cache (užitečné pro testování nebo přednastavení)
 */
export function setRateInCache(date: Date, rate: number): void {
  rateCache.set(formatDateKey(date), rate);
}
