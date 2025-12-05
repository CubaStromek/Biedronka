import { db } from "./db";
import { type Upload, type InsertUpload, type Product, type InsertProduct, uploads, products } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface ProductWithUpload extends Product {
  uploadFilename: string;
  uploadDate: Date;
}

export interface IStorage {
  createUpload(upload: InsertUpload): Promise<Upload>;
  getUpload(id: string): Promise<Upload | undefined>;
  getAllUploads(): Promise<Upload[]>;
  deleteUpload(id: string): Promise<void>;
  createProducts(products: InsertProduct[]): Promise<Product[]>;
  getProductsByUploadId(uploadId: string): Promise<Product[]>;
  getAllProductsWithUploads(): Promise<ProductWithUpload[]>;
  createUploadWithProducts(upload: InsertUpload, productData: InsertProduct[]): Promise<{ upload: Upload; products: Product[] }>;
}

class StorageImpl implements IStorage {
  async createUpload(insertUpload: InsertUpload): Promise<Upload> {
    const id = randomUUID();
    await db.insert(uploads).values({ ...insertUpload, id });
    const [upload] = await db.select().from(uploads).where(eq(uploads.id, id));
    return upload;
  }

  async getUpload(id: string): Promise<Upload | undefined> {
    const [upload] = await db.select().from(uploads).where(eq(uploads.id, id));
    return upload;
  }

  async getAllUploads(): Promise<Upload[]> {
    return db.select().from(uploads).orderBy(desc(uploads.uploadedAt));
  }

  async deleteUpload(id: string): Promise<void> {
    await db.delete(uploads).where(eq(uploads.id, id));
  }

  async createProducts(insertProducts: InsertProduct[]): Promise<Product[]> {
    if (insertProducts.length === 0) return [];
    const productsWithIds = insertProducts.map(p => ({ ...p, id: randomUUID() }));
    await db.insert(products).values(productsWithIds);
    return db.select().from(products).where(eq(products.uploadId, insertProducts[0].uploadId));
  }

  async getProductsByUploadId(uploadId: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.uploadId, uploadId));
  }

  async getAllProductsWithUploads(): Promise<ProductWithUpload[]> {
    const result = await db
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
      .orderBy(uploads.uploadedAt);
    return result;
  }

  async createUploadWithProducts(
    insertUpload: InsertUpload,
    productData: InsertProduct[]
  ): Promise<{ upload: Upload; products: Product[] }> {
    const uploadId = randomUUID();
    console.log("STORAGE: Creating upload", uploadId);
    
    // Insert upload - catch and ignore the transaction error
    try {
      await db.insert(uploads).values({ ...insertUpload, id: uploadId });
    } catch (e: any) {
      if (!e?.message?.includes?.('Transaction')) throw e;
      console.log("STORAGE: Caught transaction error on upload insert, continuing...");
    }
    
    // Verify upload was created
    const [upload] = await db.select().from(uploads).where(eq(uploads.id, uploadId));
    if (!upload) throw new Error("Upload creation failed");
    console.log("STORAGE: Upload created successfully");
    
    if (productData.length === 0) {
      return { upload, products: [] };
    }
    
    // Insert products - catch and ignore the transaction error
    const productsWithIds = productData.map(p => ({
      ...p,
      id: randomUUID(),
      uploadId: uploadId
    }));
    
    console.log("STORAGE: Inserting", productsWithIds.length, "products");
    
    try {
      await db.insert(products).values(productsWithIds);
    } catch (e: any) {
      if (!e?.message?.includes?.('Transaction')) {
        // Real error - rollback
        await db.delete(uploads).where(eq(uploads.id, uploadId));
        throw e;
      }
      console.log("STORAGE: Caught transaction error on products insert, continuing...");
    }
    
    // Verify products were created
    const createdProducts = await db.select().from(products).where(eq(products.uploadId, uploadId));
    console.log("STORAGE: Products created:", createdProducts.length);
    
    if (createdProducts.length === 0) {
      // Products really failed - rollback
      await db.delete(uploads).where(eq(uploads.id, uploadId));
      throw new Error("Products insertion failed");
    }
    
    return { upload, products: createdProducts };
  }
}

export const storage = new StorageImpl();
