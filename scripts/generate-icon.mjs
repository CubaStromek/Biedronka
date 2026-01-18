import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.join(__dirname, '..', 'build');

const sizes = [16, 32, 48, 64, 128, 256, 512];

async function generateIcons() {
  const svgPath = path.join(buildDir, 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  console.log('Generating PNG icons...');

  // Generate PNGs for each size
  const pngPaths = [];
  for (const size of sizes) {
    const pngPath = path.join(buildDir, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(pngPath);
    pngPaths.push(pngPath);
    console.log(`  Created icon-${size}.png`);
  }

  // Create main icon.png (256x256)
  const mainPngPath = path.join(buildDir, 'icon.png');
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(mainPngPath);
  console.log('  Created icon.png (256x256)');

  // Generate ICO file
  console.log('Generating ICO file...');
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const icoPngPaths = icoSizes.map(size => path.join(buildDir, `icon-${size}.png`));

  const icoBuffer = await pngToIco(icoPngPaths);
  const icoPath = path.join(buildDir, 'icon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('  Created icon.ico');

  console.log('\nDone! Icons generated in build/ directory');
}

generateIcons().catch(console.error);
