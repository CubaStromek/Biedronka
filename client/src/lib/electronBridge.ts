// Electron Bridge - abstrakce pro komunikaci s Electron main procesem
// Automaticky detekuje, zda běží v Electron nebo ve webovém prohlížeči

import type { Upload, Product } from "@shared/schema";

// Type declaration for Electron API exposed via preload
declare global {
  interface Window {
    electronAPI?: {
      getAllUploads: () => Promise<Upload[]>;
      getProductsByUpload: (uploadId: string) => Promise<Product[]>;
      deleteUpload: (uploadId: string) => Promise<void>;
      getPriceHistory: () => Promise<ProductWithUpload[]>;
      createUploadWithProducts: (data: {
        filename: string;
        products: Array<{ name: string; totalPrice: string; category?: string }>;
      }) => Promise<{ upload: Upload; products: Product[] }>;
      openFileDialog: () => Promise<{ path: string; filename: string; buffer: string } | null>;
      parseXLSX: (base64Buffer: string, filename: string) => Promise<ParseResult>;
      openAndParseFile: () => Promise<FileOpenResult | null>;
      getAllCategories: () => Promise<Category[]>;
      createCategory: (name: string) => Promise<Category>;
      updateCategory: (id: string, name: string) => Promise<Category | null>;
      deleteCategory: (id: string) => Promise<void>;
      updateProductCategory: (productId: string, category: string | null) => Promise<Product | null>;
    };
  }
}

export interface ProductWithUpload extends Product {
  uploadFilename: string;
  uploadDate: Date;
}

export interface ParsedProduct {
  name: string;
  totalPrice: string;
  category?: string;
}

export interface ParseResult {
  products: ParsedProduct[];
  errors: string[];
}

export interface FileOpenResult {
  filename: string;
  products: ParsedProduct[];
  errors: string[];
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

// Detekce Electron prostředí
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

// API pro práci s daty
export const electronBridge = {
  // Získat všechny uploady
  async getAllUploads(): Promise<Upload[]> {
    if (isElectron()) {
      return window.electronAPI!.getAllUploads();
    }
    // Fallback pro web verzi
    const res = await fetch('/api/uploads');
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
  },

  // Získat produkty pro upload
  async getProductsByUpload(uploadId: string): Promise<Product[]> {
    if (isElectron()) {
      return window.electronAPI!.getProductsByUpload(uploadId);
    }
    // Fallback pro web verzi
    const res = await fetch(`/api/uploads/${uploadId}/products`);
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
  },

  // Smazat upload
  async deleteUpload(uploadId: string): Promise<void> {
    if (isElectron()) {
      await window.electronAPI!.deleteUpload(uploadId);
      return;
    }
    // Fallback pro web verzi
    const res = await fetch(`/api/uploads/${uploadId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  },

  // Získat historii cen
  async getPriceHistory(): Promise<ProductWithUpload[]> {
    if (isElectron()) {
      return window.electronAPI!.getPriceHistory();
    }
    // Fallback pro web verzi
    const res = await fetch('/api/price-history');
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
  },

  // Vytvořit upload s produkty
  async createUploadWithProducts(data: {
    filename: string;
    products: Array<{ name: string; totalPrice: string; category?: string }>;
  }): Promise<{ upload: Upload; products: Product[] }> {
    if (isElectron()) {
      return window.electronAPI!.createUploadWithProducts(data);
    }
    // Fallback pro web verzi
    const res = await fetch('/api/uploads/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
  },

  // Otevřít dialog pro výběr souboru (pouze Electron)
  async openFileDialog(): Promise<{ path: string; filename: string; buffer: string } | null> {
    if (!isElectron()) {
      throw new Error('openFileDialog is only available in Electron');
    }
    return window.electronAPI!.openFileDialog();
  },

  // Parsovat XLSX soubor (pouze Electron)
  async parseXLSX(base64Buffer: string, filename: string): Promise<ParseResult> {
    if (!isElectron()) {
      throw new Error('parseXLSX is only available in Electron');
    }
    return window.electronAPI!.parseXLSX(base64Buffer, filename);
  },

  // Otevřít a parsovat soubor v jednom kroku (pouze Electron)
  async openAndParseFile(): Promise<FileOpenResult | null> {
    if (!isElectron()) {
      throw new Error('openAndParseFile is only available in Electron');
    }
    return window.electronAPI!.openAndParseFile();
  },

  // === Kategorie operace ===

  // Získat všechny kategorie
  async getAllCategories(): Promise<Category[]> {
    if (isElectron()) {
      return window.electronAPI!.getAllCategories();
    }
    // Fallback pro web verzi
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
  },

  // Vytvořit kategorii
  async createCategory(name: string): Promise<Category> {
    if (isElectron()) {
      return window.electronAPI!.createCategory(name);
    }
    // Fallback pro web verzi
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
  },

  // Aktualizovat kategorii
  async updateCategory(id: string, name: string): Promise<Category | null> {
    if (isElectron()) {
      return window.electronAPI!.updateCategory(id, name);
    }
    // Fallback pro web verzi
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
  },

  // Smazat kategorii
  async deleteCategory(id: string): Promise<void> {
    if (isElectron()) {
      await window.electronAPI!.deleteCategory(id);
      return;
    }
    // Fallback pro web verzi
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  },

  // === Update kategorie produktu ===

  // Aktualizovat kategorii produktu
  async updateProductCategory(productId: string, category: string | null): Promise<Product | null> {
    if (isElectron()) {
      return window.electronAPI!.updateProductCategory(productId, category);
    }
    // Fallback pro web verzi
    const res = await fetch(`/api/products/${productId}/category`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
  },
};
