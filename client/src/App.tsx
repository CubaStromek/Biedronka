import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "@/pages/Home";
import PriceHistory from "@/pages/PriceHistory";
import NotFound from "@/pages/not-found";
import { isElectron } from "@/lib/electronBridge";

function Routes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/price-history" component={PriceHistory} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  // V Electronu použít hash-based routing (file:// protokol nepodporuje history API)
  if (isElectron()) {
    return (
      <WouterRouter hook={useHashLocation}>
        <Routes />
      </WouterRouter>
    );
  }

  // Ve webu použít standardní routing
  return <Routes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
