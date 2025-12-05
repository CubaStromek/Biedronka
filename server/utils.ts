import { ZodError } from "zod";
import type { Response } from "express";

export function handleError(error: unknown, res: Response, context: string) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${context}] Error:`, errorMessage);

  if (error instanceof ZodError) {
    return res.status(422).json({
      error: "Validation failed",
      details: error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  if (error instanceof Error) {
    const statusCode = error.message.includes("not found") ? 404 : 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error",
    });
  }

  return res.status(500).json({ error: "Internal server error" });
}

export function normalizeProductName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}
