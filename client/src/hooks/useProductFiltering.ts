import { useState, useMemo } from "react";
import type { Product, ProductDisplay } from "@shared/schema";
import { parseDecimal, calculateProductStats } from "@shared/utils";

export function useProductFiltering(products: Product[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const displayData: ProductDisplay[] = useMemo(() => {
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      totalPrice: parseDecimal(p.totalPrice),
      category: p.category || undefined,
    }));
  }, [products]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    displayData.forEach((item) => {
      if (item.category) {
        uniqueCategories.add(item.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [displayData]);

  const filteredData = useMemo(() => {
    let filtered = displayData;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [displayData, selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    return calculateProductStats(filteredData);
  }, [filteredData]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredData,
    stats,
    resetFilters,
  };
}
