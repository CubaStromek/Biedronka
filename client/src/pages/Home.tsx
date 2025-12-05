import React from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import SummaryCards from "@/components/SummaryCards";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import DataTable from "@/components/DataTable";
import UploadHistory from "@/components/UploadHistory";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/queryKeys";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useProductFiltering } from "@/hooks/useProductFiltering";
import { useUploadsViewModel } from "@/hooks/useUploadsViewModel";
import type { Product } from "@shared/schema";

export default function Home() {
  const {
    uploads,
    currentUploadId,
    setCurrentUploadId,
    handleDeleteUpload,
    isMobile,
    hasUploads,
  } = useUploadsViewModel();

  const { handleFileUpload, isLoading: isUploadingFile } = useFileUpload();

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: queryKeys.uploads.products(currentUploadId || ""),
    enabled: !!currentUploadId,
  });

  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredData,
    stats,
    resetFilters,
  } = useProductFiltering(products);

  const onFileSelect = (file: File) => {
    handleFileUpload(file, (uploadId) => {
      setCurrentUploadId(uploadId);
      resetFilters();
    });
  };

  const isLoading = isUploadingFile || isLoadingProducts;
  const hasData = hasUploads && currentUploadId;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container mx-auto flex-1 space-y-8 p-4 md:p-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {!isMobile && (
            <div className="lg:w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">Nahrát soubor</h2>
                  <p className="text-sm text-muted-foreground">
                    Nahrajte soubor XLS nebo XLSX s vašimi nákupními daty
                  </p>
                </div>

                <FileUpload onFileSelect={onFileSelect} isLoading={isUploadingFile} />

                {uploads.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Historie nahrání</label>
                      <span className="text-xs text-muted-foreground">
                        {uploads.length} {uploads.length === 1 ? "soubor" : uploads.length < 5 ? "soubory" : "souborů"}
                      </span>
                    </div>
                    <UploadHistory
                      uploads={uploads}
                      currentUploadId={currentUploadId}
                      onSelectUpload={setCurrentUploadId}
                      onDeleteUpload={handleDeleteUpload}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 space-y-6">
            {isLoading ? (
              <LoadingState />
            ) : !hasData ? (
              <EmptyState isMobile={isMobile} />
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">Přehled nákupu</h2>
                    <p className="text-sm text-muted-foreground">
                      {uploads.find((u) => u.id === currentUploadId)?.filename}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isMobile && uploads.length > 0 && (
                      <Select value={currentUploadId || ""} onValueChange={setCurrentUploadId}>
                        <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-mobile-upload">
                          <SelectValue placeholder="Vybrat soubor" />
                        </SelectTrigger>
                        <SelectContent>
                          {uploads.map((upload) => (
                            <SelectItem key={upload.id} value={upload.id} data-testid={`option-upload-${upload.id}`}>
                              {upload.filename}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {!isMobile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUpload(currentUploadId)}
                        data-testid="button-delete-upload"
                      >
                        Smazat nahrání
                      </Button>
                    )}
                  </div>
                </div>

                {!isMobile && (
                  <SummaryCards
                    totalProducts={stats.totalProducts}
                    totalValue={stats.totalValue}
                    averagePrice={stats.averagePrice}
                  />
                )}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <SearchBar
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Hledat podle názvu produktu..."
                    />
                  </div>
                  <CategoryFilter
                    categories={categories}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                  />
                </div>

                <DataTable data={filteredData} isMobile={isMobile} />

                {filteredData.length === 0 && (searchQuery || selectedCategory !== "all") && (
                  <div className="flex min-h-[200px] items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      Žádné produkty neodpovídají vašim filtrům
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
