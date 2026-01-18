/**
 * Parser JSON paragonů z Biedronky
 * Extrahuje produkty, přepočítává ceny z PLN na CZK
 */

import { categorizeProduct } from './productCategorizer.js';

// Typy pro strukturu JSON paragonu
interface ParagonSellLine {
  name: string;
  vatId: string;
  price: number;      // cena za jednotku v groszech
  total: number;      // celková cena v groszech
  quantity: string;   // množství jako string
  isStorno: boolean;
}

interface ParagonBodyItem {
  sellLine?: ParagonSellLine;
  discountLine?: unknown;
  payment?: unknown;
  vatSummary?: unknown;
  sumInCurrency?: unknown;
  fiscalFooter?: unknown;
  section?: unknown;
  pack?: unknown;
  addLine?: unknown;
  barcode?: unknown;
  sysNumber?: unknown;
}

interface ParagonHeaderData {
  tin: string;
  docNumber: number;
  date: string;    // ISO datum
  CPS: number;
}

interface ParagonHeader {
  image?: unknown;
  headerText?: unknown;
  headerData?: ParagonHeaderData;
}

interface BiedronkaParagon {
  protoVersion: string;
  IDZ: string;
  deviceType: number;
  printed: boolean;
  data: string;
  header: ParagonHeader[];
  body: ParagonBodyItem[];
  sign: string;
}

// Výstupní typy
export interface ParsedParagonProduct {
  name: string;
  totalPrice: number;   // cena za jednotku v CZK
  category?: string;
}

export interface ParsedParagon {
  date: Date;
  storeName: string;
  products: ParsedParagonProduct[];
  exchangeRate: number;
}

/**
 * Odstraní trailing DPH kategorii z názvu produktu
 * Např. "MlekoWiejsk 3,2 1L       C" -> "MlekoWiejsk 3,2 1L"
 */
function cleanProductName(name: string): string {
  // Odstraníme trailing mezery a jedno písmeno (DPH kategorie)
  return name.replace(/\s+[A-Z]$/, '').trim();
}

/**
 * Extrahuje datum nákupu z hlavičky paragonu
 */
function extractDate(paragon: BiedronkaParagon): Date {
  // Datum je v header[2].headerData.date
  const headerData = paragon.header.find(h => h.headerData)?.headerData;

  if (headerData?.date) {
    return new Date(headerData.date);
  }

  // Fallback na aktuální datum
  console.warn('Nepodařilo se extrahovat datum z paragonu, používám aktuální datum');
  return new Date();
}

/**
 * Extrahuje název obchodu z paragonu
 */
function extractStoreName(paragon: BiedronkaParagon): string {
  // Název obchodu je zakódován v IDZ
  // Formát: "...s=7441|..." kde 7441 je číslo pobočky
  const match = paragon.IDZ?.match(/s=(\d+)/);
  if (match) {
    return `Biedronka ${match[1]}`;
  }
  return 'Biedronka';
}

/**
 * Parsuje JSON paragon z Biedronky
 *
 * @param json Obsah JSON souboru (jako objekt nebo string)
 * @param exchangeRate Kurz PLN/CZK
 * @returns Rozparsovaný paragon s produkty
 */
export function parseJsonParagon(
  json: unknown,
  exchangeRate: number
): ParsedParagon {
  // Parsovat JSON pokud je string
  const paragon: BiedronkaParagon = typeof json === 'string' ? JSON.parse(json) : json;

  const date = extractDate(paragon);
  const storeName = extractStoreName(paragon);
  const products: ParsedParagonProduct[] = [];

  // Projít všechny položky v body
  for (const item of paragon.body) {
    // Zpracovat pouze sellLine (produkty)
    if (item.sellLine && !item.sellLine.isStorno) {
      const sellLine = item.sellLine;

      // Název - očistit od trailing DPH kategorie
      const name = cleanProductName(sellLine.name);

      // Cena za jednotku: price je v groszech, převést na PLN a pak na CZK
      const unitPricePLN = sellLine.price / 100;
      const unitPriceCZK = unitPricePLN * exchangeRate;

      // Auto-kategorizace
      const category = categorizeProduct(name);

      products.push({
        name,
        totalPrice: Math.round(unitPriceCZK * 100) / 100, // Zaokrouhlit na 2 des. místa
        category,
      });
    }
  }

  return {
    date,
    storeName,
    products,
    exchangeRate,
  };
}

/**
 * Validuje, zda je objekt validní Biedronka paragon
 */
export function isValidBiedronkaParagon(json: unknown): boolean {
  if (typeof json !== 'object' || json === null) {
    return false;
  }

  const obj = json as Record<string, unknown>;

  // Kontrola povinných polí
  return (
    Array.isArray(obj.header) &&
    Array.isArray(obj.body) &&
    typeof obj.IDZ === 'string' &&
    obj.IDZ.includes('|')
  );
}

/**
 * Extrahuje datum z paragonu bez parsování celého obsahu
 * Užitečné pro získání data před voláním API pro kurz
 */
export function extractParagonDate(json: unknown): Date | null {
  try {
    const paragon: BiedronkaParagon = typeof json === 'string' ? JSON.parse(json) : json;

    if (!Array.isArray(paragon.header)) {
      return null;
    }

    const headerData = paragon.header.find(h => h.headerData)?.headerData;
    if (headerData?.date) {
      return new Date(headerData.date);
    }

    return null;
  } catch {
    return null;
  }
}
