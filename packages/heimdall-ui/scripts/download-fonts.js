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

function downloadFile(url, dest, redirects = 0) {
  const MAX_REDIRECTS = 5;

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    const request = https.get(url, { timeout: 10000 }, (response) => {
      // Handle HTTP redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.destroy();
        fs.unlink(dest, () => {
          if (redirects >= MAX_REDIRECTS) {
            reject(new Error(`Too many redirects for ${url}`));
            return;
          }
          downloadFile(response.headers.location, dest, redirects + 1)
            .then(resolve)
            .catch(reject);
        });
        return;
      }

      if (response.statusCode !== 200) {
        file.destroy();
        fs.unlink(dest, () => {
          reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        });
        return;
      }

      response.on('error', (err) => {
        file.destroy();
        fs.unlink(dest, () => reject(err));
      });

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });

    request.on('timeout', () => {
      request.destroy();
      file.destroy();
      fs.unlink(dest, () => {
        reject(new Error(`Request timeout for ${url}`));
      });
    });

    request.on('error', (err) => {
      file.destroy();
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function downloadFonts() {
  createDirs();

  console.log('Downloading fonts...');

  let successCount = 0;
  let totalCount = 0;

  for (const [family, variants] of Object.entries(fonts)) {
    const baseUrl = BASE_URLS[family];
    for (const variant of variants) {
      const filename = `${family === 'inter' ? 'Inter' : 'JetBrainsMono'}-${variant}.woff2`;
      const url = `${baseUrl}${variant}.woff2`;
      const dest = path.join(fontsDir, family, filename);

      totalCount++;

      // Skip if already exists
      if (fs.existsSync(dest)) {
        console.log(`  ✓ ${filename} (already exists)`);
        successCount++;
        continue;
      }

      try {
        await downloadFile(url, dest);
        console.log(`  ✓ Downloaded ${filename}`);
        successCount++;
      } catch (err) {
        console.warn(`  ⚠ Failed to download ${filename}: ${err.message}`);
      }
    }
  }

  console.log('Font download complete.');

  if (successCount === 0) {
    console.error('Error: No fonts were downloaded successfully.');
    process.exit(1);
  }

  if (successCount < totalCount) {
    console.warn(`Warning: Only ${successCount}/${totalCount} fonts were downloaded.`);
  }
}

downloadFonts().catch((err) => {
  console.error('Error downloading fonts:', err);
  process.exit(1);
});
