# Biedronka - Electron Development Notes

Poznámky a řešení problémů při konverzi webové aplikace na Electron desktop aplikaci.

---

## 1. Architektura projektu

### Struktura složek
```
electron/
├── main/
│   ├── index.ts          # Hlavní Electron proces
│   ├── database.ts       # SQLite + Drizzle (synchronní API)
│   └── ipc-handlers.ts   # IPC handlery (nahrada REST API)
├── preload/
│   └── index.ts          # Bridge mezi main a renderer
└── types.d.ts            # TypeScript typy pro window.electronAPI
```

### Klíčové soubory
- `electron-builder.config.js` - konfigurace buildu
- `tsconfig.electron.json` - TypeScript config pro Electron
- `client/src/lib/electronBridge.ts` - abstrakce pro IPC volání v rendereru

---

## 2. Překonané problémy

### 2.1 Rozdílné formáty dat mezi serverem a Electronem

**Problém:** Funkce "Historie cen" způsobovala pád aplikace.

**Příčina:** Server endpoint `/api/price-history` prováděl transformaci dat - seskupoval produkty podle názvu a vytvářel strukturu `PriceHistoryItem` s polem `priceHistory`. Electron IPC handler vracel jen surová data bez transformace.

**Řešení:** Přidat stejnou transformační logiku do `electron/main/ipc-handlers.ts`:

```typescript
// Helper funkce pro normalizaci názvu produktu
function normalizeProductName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

ipcMain.handle('db:getPriceHistory', async (): Promise<PriceHistoryItem[]> => {
  const productsWithUploads = storage.getAllProductsWithUploads();

  // Seskupit produkty podle normalizovaného názvu + kategorie
  const groupedMap = new Map<string, {...}>();

  for (const product of productsWithUploads) {
    const normalizedName = normalizeProductName(product.name);
    const groupKey = `${normalizedName}|||${product.category || ""}`;
    // ... seskupování
  }

  return Array.from(groupedMap.values());
});
```

**Poučení:** Při migraci REST API na IPC je nutné zajistit, že IPC handlery vracejí data ve stejném formátu jako původní API endpointy.

---

### 2.2 Client-side routing nefunguje s file:// protokolem

**Problém:** Po načtení produkčního buildu se zobrazila "404 Page Not Found".

**Příčina:** Wouter router používá `window.location.pathname`, ale při načítání z `file://` protokolu je cesta něco jako `file:///C:/path/to/app.asar/client-dist/index.html`, ne `/`.

**Řešení:** Použít hash-based routing pro Electron:

```typescript
// client/src/App.tsx
import { useHashLocation } from "wouter/use-hash-location";
import { isElectron } from "@/lib/electronBridge";

function Router() {
  if (isElectron()) {
    return (
      <WouterRouter hook={useHashLocation}>
        <Routes />
      </WouterRouter>
    );
  }
  return <Routes />;
}
```

**Poučení:** File protokol nepodporuje History API. Hash-based routing (`/#/price-history`) funguje všude.

---

### 2.3 Electron-builder nezahrnuje buildované soubory

**Problém:** Aplikace se spustila, ale zobrazovala prázdnou stránku.

**Příčina:** Pattern `dist/public/**/*` v `files` konfiguraci nefungoval - soubory nebyly zahrnuty do ASAR.

**Řešení:**
1. Změnit výstupní složku Vite na `client-dist`
2. Aktualizovat electron-builder config:
```javascript
files: [
  "dist-electron/**/*",
  "client-dist/**/*",
  "package.json",
],
```
3. Aktualizovat cestu v main procesu:
```typescript
const indexPath = path.join(appPath, 'client-dist/index.html');
```

**Poučení:** Ověřit obsah ASAR pomocí `npx asar list app.asar | grep index.html`

---

### 2.4 Build selhává - soubor je používán jiným procesem

**Problém:** `ENOENT: no such file or directory, rename 'electron.exe' -> 'biedronka.exe'`

**Příčina:** Běžící instance Electron drží soubory.

**Řešení:** Před buildem ukončit všechny Electron procesy:
```bash
taskkill /F /IM electron.exe
taskkill /F /IM biedronka.exe
rm -rf dist/
```

**Poučení:** Vždy zavřít aplikaci před novým buildem.

---

### 2.5 Synchronní vs asynchronní databázové operace

**Problém:** Drizzle ORM s PostgreSQL používá async operace, ale better-sqlite3 je synchronní.

**Řešení:** V Electron verzi použít synchronní API:
```typescript
// Server (PostgreSQL) - async
async getAllUploads(): Promise<Upload[]> {
  return await db.select().from(uploads);
}

// Electron (SQLite) - sync
getAllUploads(): Upload[] {
  return db.select().from(uploads).all();
}
```

**Poučení:** SQLite s better-sqlite3 je synchronní - nepotřebuje async/await.

---

## 3. Electron-builder konfigurace

### Funkční konfigurace
```javascript
module.exports = {
  appId: 'cz.biedronka.app',
  productName: 'Biedronka',

  directories: {
    output: 'electron-dist',
  },

  files: [
    "dist-electron/**/*",
    "client-dist/**/*",
    "package.json",
  ],

  extraMetadata: {
    main: "dist-electron/electron/main/index.js",
  },

  asar: true,
  asarUnpack: [
    "**/node_modules/better-sqlite3/**/*",
  ],

  win: {
    target: 'dir',  // Pro rychlý vývoj bez instalátoru
    signAndEditExecutable: false,
  },
};
```

### Tipy
- `target: 'dir'` - rychlejší build bez vytváření instalátoru
- `asar: true` - zabalit do ASAR archivu
- `asarUnpack` - nativní moduly (better-sqlite3) musí být mimo ASAR

---

## 4. Detekce Electron prostředí

```typescript
// client/src/lib/electronBridge.ts
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};
```

Použití v kódu:
```typescript
if (isElectron()) {
  // Electron-specifická logika (IPC)
  return window.electronAPI.getAllUploads();
} else {
  // Web verze (fetch)
  return fetch('/api/uploads').then(r => r.json());
}
```

---

## 5. Užitečné příkazy

```bash
# Development
npm run electron:dev

# Production build (pouze složka, bez instalátoru)
npm run build:client && npm run build:electron && npx electron-builder --win --dir

# Ověření obsahu ASAR
npx asar list dist/win-unpacked/resources/app.asar

# Ukončení běžících procesů
taskkill /F /IM electron.exe
taskkill /F /IM biedronka.exe

# Vyčištění před buildem
rm -rf dist/ client-dist/ dist-electron/
```

---

## 6. Checklist před buildem

- [ ] Ukončit běžící instance aplikace
- [ ] Smazat staré build složky
- [ ] Ověřit, že `vite.config.ts` builduje do `client-dist`
- [ ] Ověřit, že `electron/main/index.ts` načítá z `client-dist/index.html`
- [ ] Ověřit, že `electron-builder.config.js` zahrnuje `client-dist/**/*`
- [ ] Zkompilovat TypeScript pro Electron: `npm run build:electron`
- [ ] Spustit build: `npx electron-builder --win --dir`

---

## 7. Známé varování (lze ignorovat)

- `Request Autofill.enable failed` - Chromium DevTools varování
- `Unable to move the cache` - dočasné soubory, neovlivňuje funkčnost
- `Browserslist: caniuse-lite is outdated` - pouze varování
- `description is missed in package.json` - kozmetické, nerozbíjí build
