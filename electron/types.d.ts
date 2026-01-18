// TypeScript deklarace pro window.electronAPI

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

export interface ElectronAPI {
  // Databázové operace
  getAllUploads: () => Promise<Upload[]>;
  getProductsByUpload: (uploadId: string) => Promise<Product[]>;
  deleteUpload: (uploadId: string) => Promise<{ success: boolean }>;
  getPriceHistory: () => Promise<ProductWithUpload[]>;
  createUploadWithProducts: (data: {
    filename: string;
    products: Array<{ name: string; totalPrice: string; category?: string }>;
  }) => Promise<{ upload: Upload; products: Product[] }>;

  // Souborové operace
  openFileDialog: () => Promise<{ path: string; filename: string; buffer: string } | null>;
  parseXLSX: (base64Buffer: string, filename: string) => Promise<ParseResult>;
  openAndParseFile: () => Promise<FileOpenResult | null>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
