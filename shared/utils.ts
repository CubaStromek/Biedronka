export function parseDecimal(value: string | number): number {
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatCurrency(value: string | number): string {
  const numValue = typeof value === "string" ? parseDecimal(value) : value;
  return new Intl.NumberFormat("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

export interface ProductStats {
  totalProducts: number;
  totalValue: number;
  averagePrice: number;
}

export function calculateProductStats(
  products: Array<{ totalPrice: string | number }>
): ProductStats {
  const totalProducts = products.length;
  const totalValue = products.reduce(
    (sum, item) => sum + parseDecimal(item.totalPrice),
    0
  );
  const averagePrice = totalProducts > 0 ? totalValue / totalProducts : 0;

  return { totalProducts, totalValue, averagePrice };
}
