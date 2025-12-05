import * as XLSX from "xlsx";

export interface ParsedProduct {
  name: string;
  totalPrice: string;
  category?: string;
}

export interface ParseResult {
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

export async function parseXLSFile(file: File): Promise<ParseResult> {
  const errors: string[] = [];
  const products: ParsedProduct[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    
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
