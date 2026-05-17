#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.join(__dirname, '../src/fonts');

const fonts = {
  inter: [
    'Light',
    'Regular',
    'Medium',
    'SemiBold',
    'Bold',
    'ExtraBold',
    'Black',
  ],
  'jetbrains-mono': ['Regular', 'Medium', 'SemiBold'],
};

const BASE_URLS = {
  inter: 'https://cdn.jsdelivr.net/npm/inter-ui/Inter-',
  'jetbrains-mono': 'https://cdn.jsdelivr.net/npm/jetbrains-mono/fonts/JetBrainsMono-',
};

function createDirs() {
  Object.keys(fonts).forEach((family) => {
    const dir = path.join(fontsDir, family);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function downloadFonts() {
  createDirs();

  console.log('Downloading fonts...');

  for (const [family, variants] of Object.entries(fonts)) {
    const baseUrl = BASE_URLS[family];
    for (const variant of variants) {
      const filename = `${family === 'inter' ? 'Inter' : 'JetBrainsMono'}-${variant}.woff2`;
      const url = `${baseUrl}${variant}.woff2`;
      const dest = path.join(fontsDir, family, filename);

      // Skip if already exists
      if (fs.existsSync(dest)) {
        console.log(`  ✓ ${filename} (already exists)`);
        continue;
      }

      try {
        await downloadFile(url, dest);
        console.log(`  ✓ Downloaded ${filename}`);
      } catch (err) {
        console.warn(`  ⚠ Failed to download ${filename}: ${err.message}`);
      }
    }
  }

  console.log('Font download complete.');
}

downloadFonts().catch((err) => {
  console.error('Error downloading fonts:', err);
  process.exit(1);
});
