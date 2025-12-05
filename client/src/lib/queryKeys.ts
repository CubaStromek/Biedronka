export const queryKeys = {
  uploads: {
    all: ["/api/uploads"] as const,
    detail: (uploadId: string) => ["/api/uploads", uploadId] as const,
    products: (uploadId: string) => ["/api/uploads", uploadId, "products"] as const,
  },
  priceHistory: {
    all: ["/api/price-history"] as const,
  },
} as const;
