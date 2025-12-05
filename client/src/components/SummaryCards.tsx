import React from "react";
import { Card } from "@/components/ui/card";
import { Package, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency } from "@shared/utils";
import type { Statistics } from "@shared/schema";

type SummaryCardsProps = Statistics;

export default function SummaryCards({
  totalProducts,
  totalValue,
  averagePrice,
}: SummaryCardsProps) {

  const cards = [
    {
      icon: Package,
      label: "Celkem produktů",
      value: totalProducts.toString(),
      testId: "text-total-products",
    },
    {
      icon: DollarSign,
      label: "Celková hodnota",
      value: `${formatCurrency(totalValue)} CZK`,
      testId: "text-total-value",
    },
    {
      icon: TrendingUp,
      label: "Průměrná cena",
      value: `${formatCurrency(averagePrice)} CZK`,
      testId: "text-average-price",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label} className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <card.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {card.label}
              </p>
              <p
                className="text-3xl font-semibold tabular-nums"
                data-testid={card.testId}
              >
                {card.value}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
