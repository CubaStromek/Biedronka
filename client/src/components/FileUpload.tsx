import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export default function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    multiple: false,
    disabled: isLoading,
  });

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
        {isDragActive ? (
          <File className="h-12 w-12 text-primary" />
        ) : (
          <Upload className="h-12 w-12 text-muted-foreground" />
        )}
        <div className="space-y-2">
          <p className="text-base font-medium">
            {isDragActive
              ? "Přetáhněte soubor sem"
              : "Přetáhněte XLS/XLSX soubor sem nebo klikněte pro výběr"}
          </p>
          <p className="text-sm text-muted-foreground">
            Podporované formáty: .xls, .xlsx (max 10MB)
          </p>
        </div>
        <Button variant="outline" type="button" data-testid="button-browse">
          Procházet soubory
        </Button>
      </div>
    </div>
  );
}
