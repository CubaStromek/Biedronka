import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { sql, eq, desc } from 'drizzle-orm';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { randomUUID } from 'crypto';

// Schema definice (kopie ze shared/schema.ts pro Electron)
export const uploads = sqliteTable("uploads", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }).notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  uploadId: text("upload_id").notNull().references(() => uploads.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  totalPrice: real("total_price").notNull(),
  category: text("category"),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Tabulka pro naučené kategorie produktů (fuzzy matching)
export const learnedCategories = sqliteTable("learned_categories", {
  id: text("id").primaryKey(),
  productNameNormalized: text("product_name_normalized").notNull().unique(),
  category: text("category").notNull(),
  originalProductName: text("original_product_name").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Typy
export interface Upload {
  id: string;
  filename: string;
  uploadedAt: Date;
}

export interface Product {
  id: string;
  uploadId: string;
  name: string;
  totalPrice: number;
  category: string | null;
}

export interface InsertUpload {
  filename: string;
}

export interface InsertProduct {
  uploadId: string;
  name: string;
  totalPrice: number;
  category?: string | null;
}

export interface ProductWithUpload extends Product {
  uploadFilename: string;
  uploadDate: Date;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface LearnedCategory {
  id: string;
  productNameNormalized: string;
  category: string;
  originalProductName: string;
  updatedAt: Date;
}

let db: BetterSQLite3Database<{ uploads: typeof uploads; products: typeof products; categories: typeof categories; learnedCategories: typeof learnedCategories }>;
let sqlite: Database.Database;

export function initializeDatabase(): void {
  // Cesta k databázi v userData složce
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'data');
  const dbPath = path.join(dbDir, 'biedronka.db');

  console.log('Database path:', dbPath);

  // Zajistit existenci složky
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Inicializovat SQLite
  sqlite = new Database(dbPath);
  db = drizzle(sqlite, { schema: { uploads, products, categories, learnedCategories } });

  // Vytvořit tabulky pokud neexistují
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      uploaded_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      upload_id TEXT NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      total_price REAL NOT NULL,
      category TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_products_upload_id ON products(upload_id);

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS learned_categories (
      id TEXT PRIMARY KEY,
      product_name_normalized TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      original_product_name TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_learned_categories_normalized ON learned_categories(product_name_normalized);
  `);

  // Zapnout foreign keys
  sqlite.exec('PRAGMA foreign_keys = ON;');

  // Vložit výchozí kategorie pokud tabulka je prázdná
  initializeDefaultCategories();

  console.log('Database initialized successfully');
}

// Výchozí kategorie
const defaultCategories = [
  "Mléčné výrobky",
  "Maso",
  "Ryby",
  "Zelenina",
  "Ovoce",
  "Pečivo",
  "Nápoje",
  "Těstoviny",
  "Konzervy a omáčky",
  "Sladkosti",
  "Mražené výrobky",
  "Koření",
  "Drogerie",
  "Vejce",
];

function initializeDefaultCategories(): void {
  const existingCategories = db.select().from(categories).all();

  if (existingCategories.length === 0) {
    defaultCategories.forEach((name, index) => {
      db.insert(categories).values({
        id: randomUUID(),
        name,
        sortOrder: index,
      }).run();
    });
    console.log('Default categories initialized');
  }
}

export function getDatabase() {
  return db;
}

// === Normalizace názvu produktu pro fuzzy matching ===

/**
 * Normalizuje název produktu pro porovnávání
 * - Převede na malá písmena
 * - Odstraní diakritiku
 * - Odstraní čísla a speciální znaky (kromě mezer)
 * - Odstraní běžné jednotky (g, kg, ml, l, ks, szt)
 * - Zkrátí na první 3 slova (hlavní identifikátor produktu)
 */
function normalizeProductNameForMatching(name: string): string {
  return name
    .toLowerCase()
    // Odstranit diakritiku
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Odstranit čísla
    .replace(/\d+/g, '')
    // Odstranit běžné jednotky
    .replace(/\b(g|kg|ml|l|ks|szt|pcs|x)\b/gi, '')
    // Odstranit speciální znaky kromě mezer
    .replace(/[^a-z\s]/g, '')
    // Nahradit více mezer jednou
    .replace(/\s+/g, ' ')
    .trim()
    // Vzít první 3 slova
    .split(' ')
    .slice(0, 3)
    .join(' ');
}

/**
 * Vypočítá podobnost dvou stringů (0-1)
 * Používá Levenshtein distance
 */
function calculateSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Levenshtein distance
  const matrix: number[][] = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const maxLen = Math.max(s1.length, s2.length);
  return 1 - matrix[s1.length][s2.length] / maxLen;
}

// Storage operace
export const storage = {
  getAllUploads(): Upload[] {
    const results = db.select().from(uploads).orderBy(desc(uploads.uploadedAt)).all();
    return results;
  },

  getUpload(id: string): Upload | undefined {
    const [upload] = db.select().from(uploads).where(eq(uploads.id, id)).all();
    return upload;
  },

  deleteUpload(id: string): void {
    db.delete(uploads).where(eq(uploads.id, id)).run();
  },

  getProductsByUploadId(uploadId: string): Product[] {
    return db.select().from(products).where(eq(products.uploadId, uploadId)).all();
  },

  getAllProductsWithUploads(): ProductWithUpload[] {
    const result = db
      .select({
        id: products.id,
        uploadId: products.uploadId,
        name: products.name,
        totalPrice: products.totalPrice,
        category: products.category,
        uploadFilename: uploads.filename,
        uploadDate: uploads.uploadedAt,
      })
      .from(products)
      .innerJoin(uploads, eq(products.uploadId, uploads.id))
      .orderBy(uploads.uploadedAt)
      .all();
    return result;
  },

  createUploadWithProducts(
    insertUpload: InsertUpload,
    productData: Array<{ name: string; totalPrice: string; category?: string }>
  ): { upload: Upload; products: Product[] } {
    const uploadId = randomUUID();
    const now = new Date();

    // Vložit upload
    db.insert(uploads).values({
      id: uploadId,
      filename: insertUpload.filename,
      uploadedAt: now,
    }).run();

    // Získat vytvořený upload
    const [upload] = db.select().from(uploads).where(eq(uploads.id, uploadId)).all();

    if (productData.length === 0) {
      return { upload, products: [] };
    }

    // Vložit produkty - pokud nemají kategorii, zkusit najít naučenou
    const productsWithIds = productData.map(p => {
      let category = p.category || null;

      // Pokud produkt nemá kategorii, zkusit najít naučenou
      if (!category) {
        category = this.findLearnedCategory(p.name);
      }

      return {
        id: randomUUID(),
        uploadId: uploadId,
        name: p.name,
        totalPrice: parseFloat(p.totalPrice),
        category,
      };
    });

    db.insert(products).values(productsWithIds).run();

    // Získat vytvořené produkty
    const createdProducts = db.select().from(products).where(eq(products.uploadId, uploadId)).all();

    return { upload, products: createdProducts };
  },

  // Kategorie operace
  getAllCategories(): Category[] {
    return db.select().from(categories).orderBy(categories.sortOrder).all();
  },

  createCategory(name: string): Category {
    const id = randomUUID();
    const maxOrder = db.select({ max: sql<number>`MAX(sort_order)` }).from(categories).get();
    const sortOrder = (maxOrder?.max ?? -1) + 1;

    db.insert(categories).values({ id, name, sortOrder }).run();
    const [category] = db.select().from(categories).where(eq(categories.id, id)).all();
    return category;
  },

  updateCategory(id: string, name: string): Category | null {
    db.update(categories).set({ name }).where(eq(categories.id, id)).run();
    const [category] = db.select().from(categories).where(eq(categories.id, id)).all();
    return category || null;
  },

  deleteCategory(id: string): void {
    db.delete(categories).where(eq(categories.id, id)).run();
  },

  // Update kategorie produktu + naučit se tuto kategorii pro budoucí použití
  updateProductCategory(productId: string, category: string | null): Product | null {
    // Aktualizovat produkt
    db.update(products).set({ category }).where(eq(products.id, productId)).run();
    const [product] = db.select().from(products).where(eq(products.id, productId)).all();

    if (!product) return null;

    // Naučit se kategorii pro tento název produktu
    if (category) {
      const normalizedName = normalizeProductNameForMatching(product.name);
      if (normalizedName.length > 0) {
        // Upsert - vložit nebo aktualizovat
        const existing = db.select().from(learnedCategories)
          .where(eq(learnedCategories.productNameNormalized, normalizedName))
          .get();

        if (existing) {
          db.update(learnedCategories)
            .set({
              category,
              originalProductName: product.name,
              updatedAt: new Date(),
            })
            .where(eq(learnedCategories.id, existing.id))
            .run();
        } else {
          db.insert(learnedCategories).values({
            id: randomUUID(),
            productNameNormalized: normalizedName,
            category,
            originalProductName: product.name,
            updatedAt: new Date(),
          }).run();
        }

        console.log(`Learned category "${category}" for normalized name "${normalizedName}"`);
      }
    }

    return product;
  },

  // Najít naučenou kategorii pro název produktu (fuzzy matching)
  findLearnedCategory(productName: string): string | null {
    const normalizedName = normalizeProductNameForMatching(productName);
    if (normalizedName.length === 0) return null;

    // Nejprve zkusit přesnou shodu
    const exactMatch = db.select().from(learnedCategories)
      .where(eq(learnedCategories.productNameNormalized, normalizedName))
      .get();

    if (exactMatch) {
      return exactMatch.category;
    }

    // Zkusit fuzzy matching - načíst všechny naučené kategorie
    const allLearned = db.select().from(learnedCategories).all();

    let bestMatch: { category: string; similarity: number } | null = null;
    const SIMILARITY_THRESHOLD = 0.75; // Minimální podobnost 75%

    for (const learned of allLearned) {
      const similarity = calculateSimilarity(normalizedName, learned.productNameNormalized);
      if (similarity >= SIMILARITY_THRESHOLD && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { category: learned.category, similarity };
      }
    }

    if (bestMatch) {
      console.log(`Fuzzy matched "${productName}" -> "${bestMatch.category}" (${(bestMatch.similarity * 100).toFixed(0)}%)`);
      return bestMatch.category;
    }

    return null;
  },
};
