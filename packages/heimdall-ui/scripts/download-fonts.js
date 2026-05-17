#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const fsPromises = fs.promises;

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

const WOFF2_SIGNATURE = Buffer.from([0x77, 0x4f, 0x46, 0x32]); // 'wOF2'
const MIN_FONT_SIZE = 1024; // Minimum reasonable font file size

async function isValidWoff2File(filePath) {
  let fd;
  try {
    const stats = await fsPromises.stat(filePath);
    if (stats.size < MIN_FONT_SIZE) {
      return false;
    }
    const buffer = Buffer.alloc(4);
    fd = await fsPromises.open(filePath, 'r');
    await fd.read(buffer, 0, 4, 0);
    return Buffer.compare(buffer, WOFF2_SIGNATURE) === 0;
  } catch {
    return false;
  } finally {
    if (fd) await fd.close().catch(() => {});
  }
}

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
        fsPromises.unlink(dest).catch((e) => console.warn('Cleanup warning:', e.message)).then(() => {
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
        fsPromises.unlink(dest).catch((e) => console.warn('Cleanup warning:', e.message)).then(() => {
          reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        });
        return;
      }

      response.on('error', (err) => {
        file.destroy();
        fsPromises.unlink(dest).catch((e) => console.warn('Cleanup warning:', e.message)).then(() => reject(err));
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
      fsPromises.unlink(dest).catch((e) => console.warn('Cleanup warning:', e.message)).then(() => {
        reject(new Error(`Request timeout for ${url}`));
      });
    });

    request.on('error', (err) => {
      file.destroy();
      fsPromises.unlink(dest).catch((e) => console.warn('Cleanup warning:', e.message)).then(() => reject(err));
    });
  });
}

async function downloadFonts() {
  createDirs();

  console.log('Downloading fonts...');

  let successCount = 0;
  let failureCount = 0;
  let totalCount = 0;
  const failures = [];

  for (const [family, variants] of Object.entries(fonts)) {
    const baseUrl = BASE_URLS[family];
    for (const variant of variants) {
      const filename = `${family === 'inter' ? 'Inter' : 'JetBrainsMono'}-${variant}.woff2`;
      const url = `${baseUrl}${variant}.woff2`;
      const dest = path.join(fontsDir, family, filename);

      totalCount++;

      // Skip if already exists and is valid
      if (fs.existsSync(dest)) {
        const isValid = await isValidWoff2File(dest);
        if (isValid) {
          console.log(`  ✓ ${filename} (already exists)`);
          successCount++;
          continue;
        }
        // Remove invalid file for retry
        try {
          await fsPromises.unlink(dest);
        } catch {
          // Continue anyway, download will overwrite
        }
      }

      try {
        await downloadFile(url, dest);

        // Validate downloaded file
        const isValid = await isValidWoff2File(dest);
        if (!isValid) {
          await fsPromises.unlink(dest);
          throw new Error('Downloaded file is not a valid WOFF2 font');
        }

        console.log(`  ✓ Downloaded ${filename}`);
        successCount++;
      } catch (err) {
        console.error(`  ✗ Failed to download ${filename}: ${err.message}`);
        failures.push(filename);
        failureCount++;
      }
    }
  }

  console.log('Font download complete.');

  if (failureCount > 0) {
    console.error(`Error: ${failureCount} font(s) failed to download: ${failures.join(', ')}`);
    process.exit(1);
  }

  console.log(`Success: All ${totalCount} fonts downloaded.`);
}

downloadFonts().catch((err) => {
  console.error('Error downloading fonts:', err);
  process.exit(1);
});
