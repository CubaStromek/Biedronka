import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { parseXLSFile } from "@shared/xlsParser";
import type { Upload } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useFileUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createUploadWithProductsMutation = useMutation({
    mutationFn: async ({
      filename,
      products,
    }: {
      filename: string;
      products: Array<{ name: string; totalPrice: string; category?: string }>;
    }) => {
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

  const handleFileUpload = async (
    file: File,
    onSuccess?: (uploadId: string) => void
  ) => {
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
    isLoading,
  };
}
