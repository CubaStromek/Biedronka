# Biedronka - Shopping Data Viewer

Desktop aplikace pro správu a analýzu nákupních dat z polského řetězce Biedronka.

![Electron](https://img.shields.io/badge/Electron-40.0.0-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite)

## Funkce

- **Import JSON paragonů** - Načtení paragonů z aplikace Biedronka
- **Automatický přepočet PLN → CZK** - Dle kurzu ČNB platného v den nákupu
- **Multi-upload** - Nahrání více souborů najednou
- **Správa kategorií** - Vlastní kategorie s automatickým učením
- **Historie cen** - Sledování vývoje cen produktů
- **Offline režim** - Veškerá data uložena lokálně v SQLite

## Screenshot

![Biedronka App](https://via.placeholder.com/800x500?text=Biedronka+App+Screenshot)

## Instalace

### Windows

1. Stáhněte `Biedronka Setup x.x.x.exe` z [Releases](https://github.com/CubaStromek/Biedronka/releases)
2. Spusťte instalátor a postupujte dle průvodce
3. Aplikace se nainstaluje a vytvoří zástupce na ploše

### Ze zdrojového kódu

```bash
# Klonovat repozitář
git clone https://github.com/CubaStromek/Biedronka.git
cd Biedronka

# Nainstalovat závislosti
npm install

# Spustit v dev režimu
npm run dev

# Sestavit instalátor
npm run build
