import React from "react";
import { FileSpreadsheet } from "lucide-react";

interface EmptyStateProps {
  isMobile?: boolean;
}

export default function EmptyState({ isMobile = false }: EmptyStateProps) {

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-muted p-6">
        <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          {isMobile ? "Žádná data k zobrazení" : "Nahrajte své nákupní data"}
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {isMobile 
            ? "V systému nejsou žádná data k zobrazení. Data se nahrávají z desktopové verze aplikace."
            : "Nahrajte soubor XLS nebo XLSX obsahující informace o nákupech a zobrazte podrobnosti o produktech a ceny v CZK"}
        </p>
      </div>
    </div>
  );
}
