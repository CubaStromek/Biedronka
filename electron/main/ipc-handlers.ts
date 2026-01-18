import { ipcMain, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { storage } from './database.js';
// Importy z shared - relativní cesta pro zkompilovanou strukturu
import { parseJsonParagon, isValidBiedronkaParagon, extractParagonDate } from '../../shared/jsonParagonParser.js';
import { getExchangeRate } from '../../shared/exchangeRateService.js';

// Helper funkce pro normalizaci názvu produktu (pro seskupování)
function normalizeProductName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Interface pro PriceHistoryItem (odpovídá shared/schema.ts)
interface PriceHistoryItem {
  name: string;
  category: string;
  priceHistory: Array<{
    price: number;
    uploadDate: string;
    uploadFilename: string;
  }>;
}

interface ParsedProduct {
  name: string;
  totalPrice: string;
  category?: string;
}

interface ParseResult {
  products: ParsedProduct[];
  errors: string[];
}

interface ColumnMapping {
  name?: string;
  price?: string;
  category?: string;
}

function detectColumns(row: Record<string, any>): ColumnMapping {
  const allKeys = Object.keys(row);

  const nameKey = allKeys.find(
    (k) =>
      k.toLowerCase().includes("product") ||
      k.toLowerCase().includes("produkt") ||
      k.toLowerCase().includes("name") ||
      k.toLowerCase().includes("item") ||
      k.toLowerCase().includes("artikel") ||
      k.toLowerCase().includes("omschrijving")
  ) || allKeys[0];

  const priceKey = allKeys.find(
    (k) =>
      k.toLowerCase() === "czk" ||
      k.toLowerCase().includes("czk") ||
      k.toLowerCase().includes("price") ||
      k.toLowerCase().includes("prijs") ||
      k.toLowerCase().includes("bedrag") ||
      k.toLowerCase().includes("totaal")
  );

  const categoryKey = allKeys.find(
    (k) =>
      k.toLowerCase().includes("categor") ||
      k.toLowerCase().includes("kategor") ||
      k.toLowerCase().includes("type")
  );

  return {
    name: nameKey,
    price: priceKey,
    category: categoryKey,
  };
}

function parseXLSXBuffer(buffer: Buffer, filename: string): ParseResult {
  const errors: string[] = [];
  const products: ParsedProduct[] = [];

  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });

    if (workbook.SheetNames.length === 0) {
      errors.push("V souboru nebyly nalezeny žádné listy");
      return { products, errors };
    }

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

    if (jsonData.length === 0) {
      errors.push("V souboru nebyla nalezena žádná data");
      return { products, errors };
    }

    const columnMapping = detectColumns(jsonData[0] as Record<string, any>);

    if (!columnMapping.price) {
      errors.push("Nepodařilo se detekovat sloupec s cenou. Očekává se sloupec s názvem 'CZK', 'Price' nebo podobně.");
      return { products, errors };
    }

    jsonData.forEach((row: any, index: number) => {
      try {
        const name = columnMapping.name ? row[columnMapping.name] : `Product ${index + 1}`;
        const rawPrice = columnMapping.price ? row[columnMapping.price] : 0;
        const category = columnMapping.category ? row[columnMapping.category] : undefined;

        const totalPrice = Number(rawPrice);

        if (isNaN(totalPrice)) {
          errors.push(`Řádek ${index + 1}: Neplatná hodnota ceny "${rawPrice}"`);
          return;
        }

        products.push({
          name: String(name),
          totalPrice: String(totalPrice),
          category: category ? String(category) : undefined,
        });
      } catch (error) {
        errors.push(`Řádek ${index + 1}: ${error instanceof Error ? error.message : "Chyba při zpracování"}`);
      }
    });

    return { products, errors };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Neznámá chyba při zpracování souboru");
    return { products, errors };
  }
}

export function registerIpcHandlers(): void {
  // Získat všechny uploady
  ipcMain.handle('db:getAllUploads', async () => {
    try {
      return storage.getAllUploads();
    } catch (error) {
      console.error('Error getting uploads:', error);
      throw error;
    }
  });

  // Získat produkty pro konkrétní upload
  ipcMain.handle('db:getProductsByUpload', async (_event, uploadId: string) => {
    try {
      return storage.getProductsByUploadId(uploadId);
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  });

  // Smazat upload
  ipcMain.handle('db:deleteUpload', async (_event, uploadId: string) => {
    try {
      storage.deleteUpload(uploadId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting upload:', error);
      throw error;
    }
  });

  // Získat historii cen - seskupuje produkty podle názvu a kategorie
  ipcMain.handle('db:getPriceHistory', async (): Promise<PriceHistoryItem[]> => {
    try {
      const productsWithUploads = storage.getAllProductsWithUploads();

      // Seskupit produkty podle normalizovaného názvu + kategorie
      const groupedMap = new Map<string, {
        name: string;
        category: string;
        priceHistory: Array<{
          price: number;
          uploadDate: string;
          uploadFilename: string;
        }>;
      }>();

      for (const product of productsWithUploads) {
        const normalizedName = normalizeProductName(product.name);
        const category = product.category || "";
        const groupKey = `${normalizedName}|||${category}`;

        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, {
            name: product.name, // Použít originální název pro zobrazení
            category: category,
            priceHistory: [],
          });
        }

        const group = groupedMap.get(groupKey)!;
        group.priceHistory.push({
          price: product.totalPrice,
          uploadDate: product.uploadDate.toISOString(),
          uploadFilename: product.uploadFilename,
        });
      }

      // Převést na pole a seřadit cenovou historii podle data
      const priceHistoryItems = Array.from(groupedMap.values()).map(item => ({
        ...item,
        priceHistory: item.priceHistory.sort((a, b) =>
          new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
        ),
      }));

      // Vrátit pouze položky s alespoň jedním cenovým bodem
      return priceHistoryItems.filter(item => item.priceHistory.length > 0);
    } catch (error) {
      console.error('Error getting price history:', error);
      throw error;
    }
  });

  // Vytvořit upload s produkty
  ipcMain.handle('db:createUploadWithProducts', async (_event, data: {
    filename: string;
    products: Array<{ name: string; totalPrice: string; category?: string }>;
  }) => {
    try {
      return storage.createUploadWithProducts(
        { filename: data.filename },
        data.products
      );
    } catch (error) {
      console.error('Error creating upload:', error);
      throw error;
    }
  });

  // Otevřít dialog pro výběr souboru
  ipcMain.handle('dialog:openFile', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Vyberte Excel soubor',
        filters: [
          { name: 'Excel soubory', extensions: ['xls', 'xlsx'] },
          { name: 'Všechny soubory', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const filePath = result.filePaths[0];
      const buffer = fs.readFileSync(filePath);
      const filename = path.basename(filePath);

      return {
        path: filePath,
        filename,
        buffer: buffer.toString('base64') // Převést na base64 pro bezpečný přenos
      };
    } catch (error) {
      console.error('Error opening file dialog:', error);
      throw error;
    }
  });

  // Parsovat XLSX soubor
  ipcMain.handle('file:parseXLSX', async (_event, base64Buffer: string, filename: string) => {
    try {
      const buffer = Buffer.from(base64Buffer, 'base64');
      return parseXLSXBuffer(buffer, filename);
    } catch (error) {
      console.error('Error parsing XLSX:', error);
      throw error;
    }
  });

  // Helper funkce pro zpracování jednoho JSON souboru
  async function parseJsonFile(filePath: string): Promise<{
    filename: string;
    products: ParsedProduct[];
    errors: string[];
    meta?: { exchangeRate: number; originalFilename: string };
  }> {
    const filename = path.basename(filePath);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const json = JSON.parse(content);

      if (!isValidBiedronkaParagon(json)) {
        return {
          filename,
          products: [],
          errors: ['Soubor není platný paragon z Biedronky']
        };
      }

      const paragonDate = extractParagonDate(json);
      if (!paragonDate) {
        return {
          filename,
          products: [],
          errors: ['Nepodařilo se extrahovat datum z paragonu']
        };
      }

      const exchangeRate = await getExchangeRate(paragonDate);
      const paragon = parseJsonParagon(json, exchangeRate);

      const products = paragon.products.map(p => ({
        name: p.name,
        totalPrice: String(p.totalPrice),
        category: p.category,
      }));

      const day = paragonDate.getDate().toString().padStart(2, '0');
      const month = (paragonDate.getMonth() + 1).toString().padStart(2, '0');
      const year = paragonDate.getFullYear();
      const displayName = `${day}/${month}/${year}`;

      return {
        filename: displayName,
        products,
        errors: [],
        meta: {
          exchangeRate,
          originalFilename: filename
        }
      };
    } catch (error) {
      return {
        filename,
        products: [],
        errors: [error instanceof Error ? error.message : 'Chyba při zpracování souboru']
      };
    }
  }

  // Kombinovaný handler - otevřít dialog a parsovat (jeden nebo více souborů)
  ipcMain.handle('file:openAndParse', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Vyberte soubory',
        filters: [
          { name: 'Podporované soubory', extensions: ['xls', 'xlsx', 'json'] },
          { name: 'Excel soubory', extensions: ['xls', 'xlsx'] },
          { name: 'JSON paragon', extensions: ['json'] },
          { name: 'Všechny soubory', extensions: ['*'] }
        ],
        properties: ['openFile', 'multiSelections'] // Povolit výběr více souborů
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      // Pokud je vybrán pouze jeden soubor, vrátit jako dříve
      if (result.filePaths.length === 1) {
        const filePath = result.filePaths[0];
        const filename = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();

        if (ext === '.json') {
          return await parseJsonFile(filePath);
        }

        // Excel soubor
        const buffer = fs.readFileSync(filePath);
        const parseResult = parseXLSXBuffer(buffer, filename);
        return { filename, ...parseResult };
      }

      // Více souborů - vrátit pole výsledků
      const results = [];
      for (const filePath of result.filePaths) {
        const ext = path.extname(filePath).toLowerCase();
        const filename = path.basename(filePath);

        if (ext === '.json') {
          results.push(await parseJsonFile(filePath));
        } else {
          // Excel soubor
          const buffer = fs.readFileSync(filePath);
          const parseResult = parseXLSXBuffer(buffer, filename);
          results.push({ filename, ...parseResult });
        }
      }

      return { multiple: true, results };
    } catch (error) {
      console.error('Error in openAndParse:', error);
      throw error;
    }
  });

  // === Kategorie handlery ===

  // Získat všechny kategorie
  ipcMain.handle('db:getAllCategories', async () => {
    try {
      return storage.getAllCategories();
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  });

  // Vytvořit kategorii
  ipcMain.handle('db:createCategory', async (_event, name: string) => {
    try {
      return storage.createCategory(name);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  });

  // Aktualizovat kategorii
  ipcMain.handle('db:updateCategory', async (_event, id: string, name: string) => {
    try {
      return storage.updateCategory(id, name);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  });

  // Smazat kategorii
  ipcMain.handle('db:deleteCategory', async (_event, id: string) => {
    try {
      storage.deleteCategory(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  });

  // === Update kategorie produktu ===

  // Aktualizovat kategorii produktu
  ipcMain.handle('db:updateProductCategory', async (_event, productId: string, category: string | null) => {
    try {
      return storage.updateProductCategory(productId, category);
    } catch (error) {
      console.error('Error updating product category:', error);
      throw error;
    }
  });
}
