import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, FolderOpen, Files } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isElectron } from "@/lib/electronBridge";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  onElectronSelect?: () => void;
  isLoading?: boolean;
  loadingProgress?: { current: number; total: number } | null;
}

export default function FileUpload({
  onFileSelect,
  onFilesSelect,
  onElectronSelect,
  isLoading,
  loadingProgress
}: FileUploadProps) {
  const inElectron = isElectron();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        // Pokud je více souborů a máme handler pro více souborů
        if (acceptedFiles.length > 1 && onFilesSelect) {
          onFilesSelect(acceptedFiles);
        } else {
          // Jinak zpracovat první soubor
          onFileSelect(acceptedFiles[0]);
        }
      }
    },
    [onFileSelect, onFilesSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/json": [".json"],
    },
    multiple: true, // Povolit více souborů
    disabled: isLoading,
    noClick: inElectron, // V Electron zakázat click na dropzone
  });

  // Handler pro Electron tlačítko
  const handleElectronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onElectronSelect && !isLoading) {
      onElectronSelect();
    }
  };

  return (
    <div
      {...getRootProps()}
      className={`
        relative flex min-h-64 cursor-pointer flex-col items-center justify-center
        rounded-lg border-2 border-dashed transition-colors
        ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent/50"
        }
        ${isLoading ? "pointer-events-none opacity-50" : ""}
      `}
      data-testid="zone-file-upload"
    >
      <input {...getInputProps()} data-testid="input-file" />
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        {isLoading && loadingProgress ? (
          <>
            <Files className="h-12 w-12 text-primary animate-pulse" />
            <div className="space-y-2">
              <p className="text-base font-medium">
                Zpracovávám soubory... ({loadingProgress.current}/{loadingProgress.total})
              </p>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                />
              </div>
            </div>
          </>
        ) : isDragActive ? (
          <>
            <File className="h-12 w-12 text-primary" />
            <p className="text-base font-medium">Přetáhněte soubory sem</p>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-base font-medium">
                {inElectron
                  ? "Přetáhněte soubory sem nebo klikněte na tlačítko"
                  : "Přetáhněte soubory sem nebo klikněte pro výběr"}
              </p>
              <p className="text-sm text-muted-foreground">
                Podporované formáty: .xls, .xlsx, .json (paragon Biedronka)
              </p>
              <p className="text-xs text-muted-foreground">
                Můžete vybrat více JSON souborů najednou
              </p>
            </div>
          </>
        )}
        {!isLoading && inElectron ? (
          <Button
            variant="default"
            type="button"
            onClick={handleElectronClick}
            disabled={isLoading}
            data-testid="button-browse"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Vybrat soubory
          </Button>
        ) : !isLoading ? (
          <Button variant="outline" type="button" data-testid="button-browse">
            Procházet soubory
          </Button>
        ) : null}
      </div>
    </div>
  );
}
