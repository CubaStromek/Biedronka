import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { initializeDatabase } from './database.js';
import { registerIpcHandlers } from './ipc-handlers.js';

// ESM kompatibilita pro __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// V development módu: pokud není zabalená aplikace a není explicitně production
const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
console.log('Mode:', isDev ? 'DEVELOPMENT' : 'PRODUCTION', '| isPackaged:', app.isPackaged, '| NODE_ENV:', process.env.NODE_ENV);

function createWindow() {
  // V produkci: soubory jsou v app.getAppPath() (ASAR nebo unpacked)
  // V dev: použít __dirname
  const appPath = app.isPackaged
    ? app.getAppPath()
    : path.join(__dirname, '../..');

  const preloadPath = app.isPackaged
    ? path.join(appPath, 'dist-electron/electron/preload/index.js')
    : path.join(__dirname, '../preload/index.js');

  console.log('App path:', appPath);
  console.log('Preload path:', preloadPath);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Nutné pro preload script
    },
    title: 'Biedronka - Analýza nákupů',
  });

  // Logovat chyby při načítání
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
  });

  if (isDev) {
    console.log('Loading dev URL: http://localhost:5555');
    mainWindow.loadURL('http://localhost:5555').catch(err => {
      console.error('Failed to load URL:', err);
    });
    mainWindow.webContents.openDevTools();
  } else {
    // V produkci načíst z client-dist
    const indexPath = path.join(appPath, 'client-dist/index.html');
    console.log('Loading production file:', indexPath);
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load file:', err);
    });
  }

  // Když se okno zavře, ukončit aplikaci (na Windows)
  mainWindow.on('closed', () => {
    mainWindow = null;
    // Na Windows explicitně ukončit aplikaci při zavření hlavního okna
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

app.whenReady().then(() => {
  // Inicializovat databázi
  initializeDatabase();

  // Registrovat IPC handlery
  registerIpcHandlers();

  // Vytvořit okno
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Zajistit čisté ukončení aplikace
app.on('before-quit', () => {
  // Vynutit zavření všech oken
  if (mainWindow) {
    mainWindow.removeAllListeners('closed');
    mainWindow.close();
  }
});

// Řešení pro Windows - ukončit proces při quit
app.on('quit', () => {
  // Explicitně ukončit proces
  process.exit(0);
});

// Zabránit vícenásobnému spuštění (zakomentováno pro testování)
// const gotTheLock = app.requestSingleInstanceLock();
// if (!gotTheLock) {
//   app.quit();
// } else {
//   app.on('second-instance', () => {
//     if (mainWindow) {
//       if (mainWindow.isMinimized()) mainWindow.restore();
//       mainWindow.focus();
//     }
//   });
// }
