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
    // Vyloučit nepotřebné soubory
    "!**/node_modules/**/*.md",
    "!**/node_modules/**/*.txt",
    "!**/node_modules/**/LICENSE*",
    "!**/node_modules/**/CHANGELOG*",
    "!**/node_modules/**/*.map",
    "!**/node_modules/**/test/**",
    "!**/node_modules/**/tests/**",
    "!**/node_modules/**/__tests__/**",
  ],

  // Ponechat pouze češtinu a angličtinu (ušetří ~44 MB)
  electronLanguages: ["en", "cs"],

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

  // Windows specifická konfigurace
  win: {
    target: 'nsis',
    icon: 'build/icon.ico',
  },

  // NSIS instalátor - průvodce instalací
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'build/icon.ico',
    uninstallerIcon: 'build/icon.ico',
    installerHeaderIcon: 'build/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Biedronka',
    license: 'LICENSE.txt',
  },
};
