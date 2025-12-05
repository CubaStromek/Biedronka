import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const uploads = sqliteTable("uploads", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  filename: text("filename").notNull(),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  uploadId: text("upload_id").notNull().references(() => uploads.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  totalPrice: real("total_price").notNull(),
  category: text("category"),
});

export const insertUploadSchema = createInsertSchema(uploads).omit({
  id: true,
  uploadedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export type InsertUpload = z.infer<typeof insertUploadSchema>;
export type Upload = typeof uploads.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Display types for frontend
export interface ProductDisplay {
  id: string;
  name: string;
  totalPrice: number;
  category?: string;
}

export interface Statistics {
  totalProducts: number;
  totalValue: number;
  averagePrice: number;
}

// Price history types
export interface PricePoint {
  price: number;
  uploadDate: string; // ISO date string from API
  uploadFilename: string;
}

export interface PriceHistoryItem {
  name: string;
  category: string;
  priceHistory: PricePoint[];
}

// Zod schemas for price history validation
export const pricePointSchema = z.object({
  price: z.number().positive(),
  uploadDate: z.string().datetime(),
  uploadFilename: z.string().min(1),
});

export const priceHistoryItemSchema = z.object({
  name: z.string().min(1),
  category: z.string(),
  priceHistory: z.array(pricePointSchema).min(1),
});
