import { z } from "zod";

// Upload type
export interface Upload {
  id: string;
  filename: string;
  uploadedAt: Date;
}

// Product type
export interface Product {
  id: string;
  uploadId: string;
  name: string;
  totalPrice: number;
  category: string | null;
}

// Insert types
export interface InsertUpload {
  filename: string;
}

export interface InsertProduct {
  uploadId: string;
  name: string;
  totalPrice: number;
  category?: string | null;
}

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

// Category type
export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

// Price history types
export interface PricePoint {
  price: number;
  uploadDate: string; // ISO date string
  uploadFilename: string;
}

export interface PriceHistoryItem {
  name: string;
  category: string;
  priceHistory: PricePoint[];
}

// Zod schemas for validation
export const pricePointSchema = z.object({
  price: z.number().positive(),
  uploadDate: z.string(),
  uploadFilename: z.string().min(1),
});

export const priceHistoryItemSchema = z.object({
  name: z.string().min(1),
  category: z.string(),
  priceHistory: z.array(pricePointSchema).min(1),
});
