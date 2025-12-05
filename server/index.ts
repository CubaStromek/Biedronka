import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

console.log("Starting server...");

// Initialize database schema if tables don't exist
function initializeDatabase() {
  try {
    // Get the same database path as in db.ts
    const dbDir = process.env.RAILWAY_VOLUME_MOUNT_PATH 
      ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, "data")
      : process.cwd();
    const dbPath = path.join(dbDir, "local.db");
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Use raw better-sqlite3 to check and create tables
    const sqlite = new Database(dbPath);
    
    // Check if uploads table exists
    const tableCheck = sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='uploads'
    `).get();
    
    if (!tableCheck) {
      console.log("Database tables not found. Initializing schema...");
      
      // Create uploads table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS uploads (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          filename TEXT NOT NULL,
          uploaded_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        )
      `);
      
      // Create products table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          upload_id TEXT NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          total_price REAL NOT NULL,
          category TEXT
        )
      `);
      
      console.log("Database schema initialized successfully!");
    } else {
      console.log("Database tables already exist.");
    }
    
    sqlite.close();
  } catch (error) {
    console.error("Error initializing database:", error);
    // Don't crash the server, but log the error
  }
}

const app = express();
console.log("Express app created");
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database schema first
  initializeDatabase();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
  server.listen(port, host, () => {
    log(`serving on port ${port}`);
  });
})();
