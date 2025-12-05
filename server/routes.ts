import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUploadSchema, insertProductSchema, uploads, products } from "@shared/schema";
import { handleError, normalizeProductName } from "./utils";
import { parseDecimal } from "@shared/utils";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all uploads
  app.get("/api/uploads", async (req, res) => {
    try {
      const uploads = await storage.getAllUploads();
      res.json(uploads);
    } catch (error) {
      handleError(error, res, "GET /api/uploads");
    }
  });

  // Create a new upload
  app.post("/api/uploads", async (req, res) => {
    try {
      const validated = insertUploadSchema.parse(req.body);
      const upload = await storage.createUpload(validated);
      res.json(upload);
    } catch (error) {
      handleError(error, res, "POST /api/uploads");
    }
  });

  // Get products for a specific upload
  app.get("/api/uploads/:uploadId/products", async (req, res) => {
    try {
      const { uploadId } = req.params;
      const products = await storage.getProductsByUploadId(uploadId);
      res.json(products);
    } catch (error) {
      handleError(error, res, `GET /api/uploads/${req.params.uploadId}/products`);
    }
  });

  // Create products for an upload
  app.post("/api/uploads/:uploadId/products", async (req, res) => {
    try {
      const { uploadId } = req.params;
      const productsData = Array.isArray(req.body) ? req.body : [req.body];
      
      const validated = productsData.map(p => 
        insertProductSchema.parse({ ...p, uploadId })
      );
      
      const products = await storage.createProducts(validated);
      res.json(products);
    } catch (error) {
      handleError(error, res, `POST /api/uploads/${req.params.uploadId}/products`);
    }
  });

  // Create upload with products - direct DB access to avoid transaction issues
  app.post("/api/uploads/batch", async (req, res) => {
    try {
      const { filename, products: productsData } = req.body;
      
      if (!filename || !Array.isArray(productsData)) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      
      // Generate upload ID
      const uploadId = randomUUID();
      
      // Insert upload directly (ignore transaction error - it still works)
      try {
        await db.insert(uploads).values({ id: uploadId, filename });
      } catch (e: any) {
        if (!e?.message?.includes?.("Transaction")) throw e;
      }
      
      // Verify upload exists
      const [upload] = await db.select().from(uploads).where(eq(uploads.id, uploadId));
      if (!upload) {
        return res.status(500).json({ error: "Failed to create upload" });
      }
      
      // Prepare products with IDs
      const productsToInsert = productsData.map((p: any) => ({
        id: randomUUID(),
        uploadId: uploadId,
        name: String(p.name),
        totalPrice: typeof p.totalPrice === 'string' ? parseFloat(p.totalPrice) : p.totalPrice,
        category: p.category ? String(p.category) : null
      }));
      
      // Insert products directly (ignore transaction error - it still works)
      try {
        await db.insert(products).values(productsToInsert);
      } catch (e: any) {
        if (!e?.message?.includes?.("Transaction")) {
          await db.delete(uploads).where(eq(uploads.id, uploadId));
          throw e;
        }
      }
      
      // Verify products exist
      const savedProducts = await db.select().from(products).where(eq(products.uploadId, uploadId));
      
      if (savedProducts.length === 0) {
        await db.delete(uploads).where(eq(uploads.id, uploadId));
        return res.status(500).json({ error: "Failed to create products" });
      }
      
      res.json({ upload, products: savedProducts });
    } catch (error) {
      handleError(error, res, "POST /api/uploads/batch");
    }
  });

  // Delete an upload (and its products via cascade)
  app.delete("/api/uploads/:uploadId", async (req, res) => {
    try {
      const { uploadId } = req.params;
      await storage.deleteUpload(uploadId);
      res.json({ success: true });
    } catch (error) {
      handleError(error, res, `DELETE /api/uploads/${req.params.uploadId}`);
    }
  });

  // Get price history - groups products by normalized name + category
  app.get("/api/price-history", async (req, res) => {
    try {
      const productsWithUploads = await storage.getAllProductsWithUploads();
      
      // Group products by normalized name + category
      const groupedMap = new Map<string, {
        name: string;
        category: string;
        priceHistory: Array<{
          price: number;
          uploadDate: Date;
          uploadFilename: string;
        }>;
      }>();

      for (const product of productsWithUploads) {
        const normalizedName = normalizeProductName(product.name);
        const category = product.category || "";
        const groupKey = `${normalizedName}|||${category}`;

        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, {
            name: product.name, // Use original name for display
            category: category,
            priceHistory: [],
          });
        }

        const group = groupedMap.get(groupKey)!;
        group.priceHistory.push({
          price: parseDecimal(product.totalPrice),
          uploadDate: product.uploadDate.toISOString(),
          uploadFilename: product.uploadFilename,
        });
      }

      // Convert to array and sort price history by date
      const priceHistoryItems = Array.from(groupedMap.values()).map(item => ({
        ...item,
        priceHistory: item.priceHistory.sort((a, b) => 
          new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
        ),
      }));

      // Only include items with at least one price point
      const filteredItems = priceHistoryItems.filter(item => item.priceHistory.length > 0);

      res.json(filteredItems);
    } catch (error) {
      handleError(error, res, "GET /api/price-history");
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
