/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  appId: 'cz.biedronka.app',
  productName: 'Biedronka',
  copyright: 'Copyright © 2024',

  directories: {
    output: 'electron-dist',
    buildResources: 'build',
  },

  // Soubory k zahrnutí
  files: [
    "dist-electron/**/*",
    "client-dist/**/*",
    "package.json",
  ],

  // Extra metadata pro Electron
  extraMetadata: {
    main: "dist-electron/electron/main/index.js",
  },

  // ASAR nastavení
  asar: true,
  asarUnpack: [
    "**/node_modules/better-sqlite3/**/*",
    "**/node_modules/bindings/**/*",
    "**/node_modules/file-uri-to-path/**/*",
  ],

  // Windows specifická konfigurace - pouze dir target (bez instalátoru)
  win: {
    target: 'dir',
    icon: 'build/icon.ico',
  },
};
