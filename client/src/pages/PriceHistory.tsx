import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@shared/utils";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { queryKeys } from "@/lib/queryKeys";
import type { PriceHistoryItem } from "@shared/schema";

export default function PriceHistory() {
  const [selectedItem, setSelectedItem] = useState<PriceHistoryItem | null>(null);

  const { data: priceHistoryItems = [], isLoading, isError, error } = useQuery<PriceHistoryItem[]>({
    queryKey: queryKeys.priceHistory.all,
  });

  // Filter items that have more than one price point (actual history)
  const itemsWithHistory = priceHistoryItems.filter(item => item.priceHistory.length > 1);
  const itemsWithSinglePrice = priceHistoryItems.filter(item => item.priceHistory.length === 1);

  if (selectedItem) {
    // Prepare chart data
    const chartData = selectedItem.priceHistory.map((point) => ({
      date: format(new Date(point.uploadDate), "d. M. yyyy", { locale: cs }),
      price: point.price,
      upload: point.uploadFilename,
    }));

    const minPrice = Math.min(...selectedItem.priceHistory.map(p => p.price));
    const maxPrice = Math.max(...selectedItem.priceHistory.map(p => p.price));
    const avgPrice = selectedItem.priceHistory.reduce((sum, p) => sum + p.price, 0) / selectedItem.priceHistory.length;
    const priceChange = selectedItem.priceHistory.length > 1 
      ? selectedItem.priceHistory[selectedItem.priceHistory.length - 1].price - selectedItem.priceHistory[0].price
      : 0;
    const firstPrice = selectedItem.priceHistory[0].price;
    const priceChangePercent = selectedItem.priceHistory.length > 1 && firstPrice > 0
      ? (priceChange / firstPrice) * 100
      : 0;

    return (
      <div className="container mx-auto space-y-6 p-4 md:p-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedItem(null)}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{selectedItem.name}</h1>
            {selectedItem.category && (
              <p className="text-sm text-muted-foreground">{selectedItem.category}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Aktuální cena</p>
              <p className="text-2xl font-bold">
                {formatCurrency(selectedItem.priceHistory[selectedItem.priceHistory.length - 1].price)}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Průměrná cena</p>
              <p className="text-2xl font-bold">{formatCurrency(avgPrice)}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Min / Max</p>
              <p className="text-2xl font-bold">
                {formatCurrency(minPrice)} / {formatCurrency(maxPrice)}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Změna</p>
              <p className={`text-2xl font-bold ${priceChange > 0 ? 'text-price-increase' : priceChange < 0 ? 'text-price-decrease' : ''}`}>
                {priceChange > 0 ? '+' : ''}{formatCurrency(priceChange)}
                <span className="text-sm ml-1">({priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(1)}%)</span>
              </p>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Vývoj ceny</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                tickFormatter={(value) => `${value} Kč`}
                domain={[Math.floor(minPrice * 0.9), Math.ceil(maxPrice * 1.1)]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <Card className="p-3">
                        <p className="font-semibold">{formatCurrency(data.price)}</p>
                        <p className="text-sm text-muted-foreground">{data.date}</p>
                        <p className="text-xs text-muted-foreground">{data.upload}</p>
                      </Card>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Cena (Kč)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Historie nákupů</h2>
          <div className="space-y-2">
            {selectedItem.priceHistory.map((point, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b py-2 last:border-0"
                data-testid={`history-entry-${index}`}
              >
                <div>
                  <p className="font-medium">{point.uploadFilename}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(point.uploadDate), "d. MMMM yyyy, HH:mm", { locale: cs })}
                  </p>
                </div>
                <p className="text-lg font-bold">{formatCurrency(point.price)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Historie cen</h1>
          <p className="text-muted-foreground">
            Sledujte vývoj cen produktů v čase
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" data-testid="button-back-home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zpět na přehled
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4" data-testid="loading-state">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <Skeleton className="h-6 w-full" />
              </Card>
            ))}
          </div>
        </div>
      ) : isError ? (
        <Alert variant="destructive" data-testid="error-state">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chyba při načítání dat</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Nepodařilo se načíst historii cen. Zkuste to prosím znovu."}
          </AlertDescription>
        </Alert>
      ) : priceHistoryItems.length === 0 ? (
        <Card className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
          <Package className="h-16 w-16 text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Žádná data</h3>
            <p className="text-sm text-muted-foreground">
              Nahrajte více souborů s nákupy pro sledování cenového vývoje
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {itemsWithHistory.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Produkty s cenovou historií ({itemsWithHistory.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {itemsWithHistory.map((item, index) => {
                  const firstPrice = item.priceHistory[0].price;
                  const lastPrice = item.priceHistory[item.priceHistory.length - 1].price;
                  const change = lastPrice - firstPrice;
                  const changePercent = (change / firstPrice) * 100;

                  return (
                    <Card
                      key={index}
                      className="cursor-pointer p-4 transition-colors hover-elevate active-elevate-2"
                      onClick={() => setSelectedItem(item)}
                      data-testid={`item-${index}`}
                    >
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          {item.category && (
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                          )}
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Aktuální cena</p>
                            <p className="text-lg font-bold">{formatCurrency(lastPrice)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${change > 0 ? 'text-price-increase' : change < 0 ? 'text-price-decrease' : ''}`}>
                              {change > 0 ? '+' : ''}{formatCurrency(change)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.priceHistory.length} nákupů
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {itemsWithSinglePrice.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produkty bez historie ({itemsWithSinglePrice.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {itemsWithSinglePrice.map((item, index) => (
                  <Card key={index} className="p-4 opacity-60" data-testid={`single-item-${index}`}>
                    <div className="space-y-2">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.category && (
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pouze 1 nákup</p>
                        <p className="text-lg font-bold">{formatCurrency(item.priceHistory[0].price)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
