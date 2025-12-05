import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@shared/utils";
import type { ProductDisplay } from "@shared/schema";

interface DataTableProps {
  data: ProductDisplay[];
  isMobile?: boolean;
}

type SortField = keyof ProductDisplay;
type SortDirection = "asc" | "desc" | null;

export default function DataTable({ data, isMobile = false }: DataTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === undefined || bValue === undefined) return 0;

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("name")}
                  className="h-auto p-0 font-medium hover-elevate"
                  data-testid="button-sort-name"
                >
                  Název produktu
                  <SortIcon field="name" />
                </Button>
              </TableHead>
              {!isMobile && data.some((item) => item.category) && (
                <TableHead className="w-40">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("category")}
                    className="h-auto p-0 font-medium hover-elevate"
                    data-testid="button-sort-category"
                  >
                    Kategorie
                    <SortIcon field="category" />
                  </Button>
                </TableHead>
              )}
              <TableHead className="w-48 text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("totalPrice")}
                  className="h-auto p-0 font-medium hover-elevate"
                  data-testid="button-sort-total-price"
                >
                  Cena (CZK)
                  <SortIcon field="totalPrice" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  Žádné produkty nenalezeny
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="hover-elevate"
                  data-testid={`row-product-${index}`}
                >
                  <TableCell className="font-medium" data-testid={`text-name-${index}`}>
                    {row.name}
                  </TableCell>
                  {!isMobile && data.some((item) => item.category) && (
                    <TableCell className="text-muted-foreground" data-testid={`text-category-${index}`}>
                      {row.category || "-"}
                    </TableCell>
                  )}
                  <TableCell className="text-right font-semibold tabular-nums" data-testid={`text-total-price-${index}`}>
                    {formatCurrency(row.totalPrice)} CZK
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
