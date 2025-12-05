import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import type { Upload } from "@shared/schema";

export function useUploadsViewModel() {
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const { data: uploads = [], isLoading: isLoadingUploads } = useQuery<Upload[]>({
    queryKey: queryKeys.uploads.all,
  });

  // Auto-select first upload when available
  useEffect(() => {
    if (uploads.length > 0 && !currentUploadId) {
      setCurrentUploadId(uploads[0].id);
    } else if (uploads.length === 0 && currentUploadId) {
      setCurrentUploadId(null);
    }
  }, [uploads, currentUploadId]);

  const deleteUploadMutation = useMutation({
    mutationFn: async (uploadId: string) => {
      await apiRequest("DELETE", `/api/uploads/${uploadId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.uploads.all });
      toast({
        title: "Nahrání smazáno",
        description: "Nahrání a jeho data byla odstraněna",
      });
    },
    onError: (error) => {
      toast({
        title: "Chyba při mazání",
        description: error instanceof Error ? error.message : "Nepodařilo se smazat nahrání",
        variant: "destructive",
      });
    },
  });

  const handleDeleteUpload = (uploadId: string) => {
    const remainingUploads = uploads.filter((u) => u.id !== uploadId);
    if (currentUploadId === uploadId) {
      setCurrentUploadId(remainingUploads.length > 0 ? remainingUploads[0].id : null);
    }
    deleteUploadMutation.mutate(uploadId);
  };

  return {
    uploads,
    currentUploadId,
    setCurrentUploadId,
    handleDeleteUpload,
    isLoadingUploads,
    isMobile,
    hasUploads: uploads.length > 0,
  };
}
