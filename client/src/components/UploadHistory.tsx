import React from "react";
import { Clock, Trash2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Upload } from "@shared/schema";
import { format } from "date-fns";

interface UploadHistoryProps {
  uploads: Upload[];
  currentUploadId: string | null;
  onSelectUpload: (uploadId: string) => void;
  onDeleteUpload: (uploadId: string) => void;
}

export default function UploadHistory({
  uploads,
  currentUploadId,
  onSelectUpload,
  onDeleteUpload,
}: UploadHistoryProps) {
  if (uploads.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold tracking-tight">Historie nahrání</h3>
      <div className="space-y-2">
        {uploads.map((upload) => (
          <Card
            key={upload.id}
            className={`p-4 cursor-pointer transition-colors ${
              currentUploadId === upload.id
                ? "border-primary bg-primary/5"
                : "hover-elevate"
            }`}
            onClick={() => onSelectUpload(upload.id)}
            data-testid={`card-upload-${upload.id}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" data-testid={`text-filename-${upload.id}`}>
                    {upload.filename}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(new Date(upload.uploadedAt), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteUpload(upload.id);
                }}
                data-testid={`button-delete-${upload.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
