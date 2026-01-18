import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { parseXLSFile } from "@shared/xlsParser";
import { parseJsonParagon, isValidBiedronkaParagon, extractParagonDate } from "@shared/jsonParagonParser";
import { getExchangeRate } from "@shared/exchangeRateService";
import { electronBridge, isElectron } from "@/lib/electronBridge";
import type { Upload } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface MultipleParseResult {
  multiple: true;
  results: Array<{
    filename: string;
    products: Array<{ name: string; totalPrice: string; category?: string }>;
    errors: string[];
  }>;
}

interface SingleParseResult {
  filename: string;
  products: Array<{ name: string; totalPrice: string; category?: string }>;
  errors: string[];
}

type ParseResult = SingleParseResult | MultipleParseResult | null;

function isMultipleResult(result: ParseResult): result is MultipleParseResult {
  return result !== null && 'multiple' in result && result.multiple === true;
}

export function useFileUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number } | null>(null);
  const { toast } = useToast();

  const createUploadWithProductsMutation = useMutation({
    mutationFn: async ({
      filename,
      products,
    }: {
      filename: string;
      products: Array<{ name: string; totalPrice: string; category?: string }>;
    }) => {
      // V Electron použít bridge
      if (isElectron()) {
        return electronBridge.createUploadWithProducts({ filename, products });
      }
      // Fallback pro web verzi
      const res = await apiRequest("POST", "/api/uploads/batch", {
        filename,
        products,
      });
      return res.json() as Promise<{ upload: Upload }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.uploads.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.uploads.products(data.upload.id),
      });
    },
  });

  // Handler pro Electron - otevře nativní dialog (podporuje více souborů)
  const handleElectronFileUpload = async (
    onSuccess?: (uploadId: string) => void
  ) => {
    setIsLoading(true);
    setLoadingProgress(null);

    try {
      const result = await electronBridge.openAndParseFile() as ParseResult;

      if (!result) {
        // Uživatel zrušil dialog
        setIsLoading(false);
        return;
      }

      // Zpracování více souborů
      if (isMultipleResult(result)) {
        const { results } = result;
        const total = results.length;
        let successCount = 0;
        let totalProducts = 0;
        let lastUploadId: string | null = null;

        setLoadingProgress({ current: 0, total });

        for (let i = 0; i < results.length; i++) {
          const { filename, products, errors } = results[i];
          setLoadingProgress({ current: i + 1, total });

          if (products.length === 0) {
            console.warn(`Soubor ${filename} přeskočen: ${errors[0] || 'žádné produkty'}`);
            continue;
          }

          try {
            const uploadResult = await createUploadWithProductsMutation.mutateAsync({
              filename,
              products,
            });
            successCount++;
            totalProducts += products.length;
            lastUploadId = uploadResult.upload.id;
          } catch (error) {
            console.error(`Chyba při zpracování ${filename}:`, error);
          }
        }

        setLoadingProgress(null);

        if (successCount > 0) {
          toast({
            title: "Soubory úspěšně nahrány",
            description: `Načteno ${totalProducts} produktů z ${successCount} souborů`,
          });
          if (lastUploadId) {
            onSuccess?.(lastUploadId);
          }
        } else {
          toast({
            title: "Žádné soubory nebyly zpracovány",
            description: "Zkontrolujte, zda jsou soubory platné paragony z Biedronky",
            variant: "destructive",
          });
        }
      } else {
        // Zpracování jednoho souboru (původní logika)
        const { filename, products, errors } = result;

        if (errors.length > 0 && products.length === 0) {
          toast({
            title: "Chyba při zpracování souboru",
            description: errors[0],
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (products.length === 0) {
          toast({
            title: "Nebyly nalezeny žádné produkty",
            description: "Soubor je pravděpodobně prázdný",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const uploadResult = await createUploadWithProductsMutation.mutateAsync({
          filename,
          products,
        });

        toast({
          title: "Soubor úspěšně nahrán",
          description: `Načteno ${products.length} produktů ze souboru ${filename}${
            errors.length > 0 ? ` (${errors.length} řádků přeskočeno)` : ""
          }`,
        });

        onSuccess?.(uploadResult.upload.id);
      }
    } catch (error) {
      toast({
        title: "Chyba při nahrávání souboru",
        description: error instanceof Error ? error.message : "Ujistěte se, že soubor je platný",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingProgress(null);
    }
  };

  // Handler pro JSON paragon z Biedronky
  const handleJsonParagonUpload = async (
    file: File,
    onSuccess?: (uploadId: string) => void
  ) => {
    setIsLoading(true);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (!isValidBiedronkaParagon(json)) {
        toast({
          title: "Neplatný formát",
          description: "Soubor není platný paragon z Biedronky",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Extrahovat datum a získat kurz
      const paragonDate = extractParagonDate(json);
      if (!paragonDate) {
        toast({
          title: "Chyba",
          description: "Nepodařilo se extrahovat datum z paragonu",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Načítání kurzu",
        description: `Získávám kurz PLN/CZK pro ${paragonDate.toLocaleDateString('cs-CZ')}...`,
      });

      const exchangeRate = await getExchangeRate(paragonDate);

      // Parsovat paragon
      const paragon = parseJsonParagon(json, exchangeRate);

      if (paragon.products.length === 0) {
        toast({
          title: "Nebyly nalezeny žádné produkty",
          description: "Paragon neobsahuje žádné produkty",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Převést produkty do formátu pro API
      const products = paragon.products.map(p => ({
        name: p.name,
        totalPrice: String(p.totalPrice),
        category: p.category,
      }));

      // Formát DD/MM/YYYY pro název uploadu
      const day = paragonDate.getDate().toString().padStart(2, '0');
      const month = (paragonDate.getMonth() + 1).toString().padStart(2, '0');
      const year = paragonDate.getFullYear();
      const displayName = `${day}/${month}/${year}`;

      const result = await createUploadWithProductsMutation.mutateAsync({
        filename: displayName,
        products,
      });

      toast({
        title: "Paragon úspěšně nahrán",
        description: `Načteno ${products.length} produktů z ${paragon.storeName} (kurz ${exchangeRate.toFixed(3)} CZK/PLN)`,
      });

      onSuccess?.(result.upload.id);
    } catch (error) {
      toast({
        title: "Chyba při zpracování paragonu",
        description: error instanceof Error ? error.message : "Neplatný formát JSON",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler pro více JSON souborů (web/drag&drop)
  const handleMultipleFilesUpload = async (
    files: File[],
    onSuccess?: (uploadId: string) => void
  ) => {
    setIsLoading(true);
    setLoadingProgress({ current: 0, total: files.length });

    let successCount = 0;
    let totalProducts = 0;
    let lastUploadId: string | null = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setLoadingProgress({ current: i + 1, total: files.length });

      // Pouze JSON soubory
      if (!file.name.toLowerCase().endsWith('.json')) {
        console.warn(`Soubor ${file.name} přeskočen: není JSON`);
        continue;
      }

      try {
        const text = await file.text();
        const json = JSON.parse(text);

        if (!isValidBiedronkaParagon(json)) {
          console.warn(`Soubor ${file.name} přeskočen: není platný paragon`);
          continue;
        }

        const paragonDate = extractParagonDate(json);
        if (!paragonDate) {
          console.warn(`Soubor ${file.name} přeskočen: chybí datum`);
          continue;
        }

        const exchangeRate = await getExchangeRate(paragonDate);
        const paragon = parseJsonParagon(json, exchangeRate);

        if (paragon.products.length === 0) {
          console.warn(`Soubor ${file.name} přeskočen: žádné produkty`);
          continue;
        }

        const products = paragon.products.map(p => ({
          name: p.name,
          totalPrice: String(p.totalPrice),
          category: p.category,
        }));

        const day = paragonDate.getDate().toString().padStart(2, '0');
        const month = (paragonDate.getMonth() + 1).toString().padStart(2, '0');
        const year = paragonDate.getFullYear();
        const displayName = `${day}/${month}/${year}`;

        const result = await createUploadWithProductsMutation.mutateAsync({
          filename: displayName,
          products,
        });

        successCount++;
        totalProducts += products.length;
        lastUploadId = result.upload.id;
      } catch (error) {
        console.error(`Chyba při zpracování ${file.name}:`, error);
      }
    }

    setLoadingProgress(null);
    setIsLoading(false);

    if (successCount > 0) {
      toast({
        title: "Soubory úspěšně nahrány",
        description: `Načteno ${totalProducts} produktů z ${successCount} souborů`,
      });
      if (lastUploadId) {
        onSuccess?.(lastUploadId);
      }
    } else {
      toast({
        title: "Žádné soubory nebyly zpracovány",
        description: "Zkontrolujte, zda jsou soubory platné paragony z Biedronky",
        variant: "destructive",
      });
    }
  };

  // Handler pro web - přijímá File objekt
  const handleFileUpload = async (
    file: File,
    onSuccess?: (uploadId: string) => void
  ) => {
    // Detekce typu souboru
    if (file.name.toLowerCase().endsWith('.json')) {
      return handleJsonParagonUpload(file, onSuccess);
    }

    setIsLoading(true);

    try {
      const { products, errors } = await parseXLSFile(file);

      if (errors.length > 0 && products.length === 0) {
        toast({
          title: "Chyba při zpracování souboru",
          description: errors[0],
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (products.length === 0) {
        toast({
          title: "Nebyly nalezeny žádné produkty",
          description: "Soubor je pravděpodobně prázdný",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const result = await createUploadWithProductsMutation.mutateAsync({
        filename: file.name,
        products,
      });

      toast({
        title: "Soubor úspěšně nahrán",
        description: `Načteno ${products.length} produktů ze souboru ${file.name}${
          errors.length > 0 ? ` (${errors.length} řádků přeskočeno)` : ""
        }`,
      });

      onSuccess?.(result.upload.id);
    } catch (error) {
      toast({
        title: "Chyba při nahrávání souboru",
        description: error instanceof Error ? error.message : "Ujistěte se, že soubor je platný XLS nebo XLSX",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleFileUpload,
    handleMultipleFilesUpload,
    handleElectronFileUpload,
    isLoading,
    loadingProgress,
    isElectron: isElectron(),
  };
}
