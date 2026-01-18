import { contextBridge, ipcRenderer } from 'electron';

// Typy pro API
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

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
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

  // Kategorie operace
  getAllCategories: () => Promise<Category[]>;
  createCategory: (name: string) => Promise<Category>;
  updateCategory: (id: string, name: string) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<{ success: boolean }>;

  // Update kategorie produktu
  updateProductCategory: (productId: string, category: string | null) => Promise<Product | null>;

  // Souborové operace
  openFileDialog: () => Promise<{ path: string; filename: string; buffer: string } | null>;
  parseXLSX: (base64Buffer: string, filename: string) => Promise<ParseResult>;
  openAndParseFile: () => Promise<FileOpenResult | null>;
}

// Vystavit API do renderer procesu
const electronAPI: ElectronAPI = {
  // Databázové operace
  getAllUploads: () => ipcRenderer.invoke('db:getAllUploads'),
  getProductsByUpload: (uploadId) => ipcRenderer.invoke('db:getProductsByUpload', uploadId),
  deleteUpload: (uploadId) => ipcRenderer.invoke('db:deleteUpload', uploadId),
  getPriceHistory: () => ipcRenderer.invoke('db:getPriceHistory'),
  createUploadWithProducts: (data) => ipcRenderer.invoke('db:createUploadWithProducts', data),

  // Kategorie operace
  getAllCategories: () => ipcRenderer.invoke('db:getAllCategories'),
  createCategory: (name) => ipcRenderer.invoke('db:createCategory', name),
  updateCategory: (id, name) => ipcRenderer.invoke('db:updateCategory', id, name),
  deleteCategory: (id) => ipcRenderer.invoke('db:deleteCategory', id),

  // Update kategorie produktu
  updateProductCategory: (productId, category) => ipcRenderer.invoke('db:updateProductCategory', productId, category),

  // Souborové operace
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  parseXLSX: (base64Buffer, filename) => ipcRenderer.invoke('file:parseXLSX', base64Buffer, filename),
  openAndParseFile: () => ipcRenderer.invoke('file:openAndParse'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
