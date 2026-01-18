const fs = require('fs');
const path = require('path');

// Create app-dist folder for electron-builder
const appDistDir = path.join(__dirname, '..', 'app-dist');

// Clean and create app-dist folder
if (fs.existsSync(appDistDir)) {
  fs.rmSync(appDistDir, { recursive: true });
}
fs.mkdirSync(appDistDir, { recursive: true });

// Copy package.json
const packageJson = require('../package.json');
// Remove dev dependencies and scripts
delete packageJson.devDependencies;
delete packageJson.scripts;
packageJson.main = 'dist-electron/electron/main/index.js';
fs.writeFileSync(
  path.join(appDistDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Copy dist-electron
const distElectronSrc = path.join(__dirname, '..', 'dist-electron');
const distElectronDst = path.join(appDistDir, 'dist-electron');
copyFolderSync(distElectronSrc, distElectronDst);

// Copy dist/public
const distPublicSrc = path.join(__dirname, '..', 'dist', 'public');
const distPublicDst = path.join(appDistDir, 'dist', 'public');
fs.mkdirSync(path.join(appDistDir, 'dist'), { recursive: true });
copyFolderSync(distPublicSrc, distPublicDst);

console.log('Build prepared in app-dist folder');

function copyFolderSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
