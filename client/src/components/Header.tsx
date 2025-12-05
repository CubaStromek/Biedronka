import React from "react";
import { Moon, Sun, TrendingUp } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const isOnPriceHistory = location === "/price-history";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Prohlížeč nákupních dat</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isMobile && (
            <Link href={isOnPriceHistory ? "/" : "/price-history"}>
              <Button
                variant={isOnPriceHistory ? "default" : "outline"}
                size="sm"
                data-testid="button-price-history"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                {isOnPriceHistory ? "Přehled nákupu" : "Historie cen"}
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
