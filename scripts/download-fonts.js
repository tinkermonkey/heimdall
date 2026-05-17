#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const fsPromises = fs.promises;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Each entry: { dest: relative-to-rootDir, url }
const FONTS = [
  // Inter — via @fontsource/inter on jsdelivr
  { dest: 'src/fonts/inter/Inter-Light.woff2',     url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-300-normal.woff2' },
  { dest: 'src/fonts/inter/Inter-Regular.woff2',   url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff2' },
  { dest: 'src/fonts/inter/Inter-Medium.woff2',    url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-500-normal.woff2' },
  { dest: 'src/fonts/inter/Inter-SemiBold.woff2',  url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-600-normal.woff2' },
  { dest: 'src/fonts/inter/Inter-Bold.woff2',      url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-700-normal.woff2' },
  { dest: 'src/fonts/inter/Inter-ExtraBold.woff2', url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-800-normal.woff2' },
  { dest: 'src/fonts/inter/Inter-Black.woff2',     url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-900-normal.woff2' },

  // JetBrains Mono — via @fontsource/jetbrains-mono on jsdelivr
  { dest: 'src/fonts/jetbrains-mono/JetBrainsMono-Regular.woff2',  url: 'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/files/jetbrains-mono-latin-400-normal.woff2' },
  { dest: 'src/fonts/jetbrains-mono/JetBrainsMono-Medium.woff2',   url: 'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/files/jetbrains-mono-latin-500-normal.woff2' },
  { dest: 'src/fonts/jetbrains-mono/JetBrainsMono-SemiBold.woff2', url: 'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/files/jetbrains-mono-latin-600-normal.woff2' },

  // public/fonts — same files served as static assets by the dev server
  { dest: 'public/fonts/inter/Inter-Light.woff2',     url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-300-normal.woff2' },
  { dest: 'public/fonts/inter/Inter-Regular.woff2',   url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff2' },
  { dest: 'public/fonts/inter/Inter-Medium.woff2',    url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-500-normal.woff2' },
  { dest: 'public/fonts/inter/Inter-SemiBold.woff2',  url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-600-normal.woff2' },
  { dest: 'public/fonts/inter/Inter-Bold.woff2',      url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-700-normal.woff2' },
  { dest: 'public/fonts/inter/Inter-ExtraBold.woff2', url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-800-normal.woff2' },
  { dest: 'public/fonts/inter/Inter-Black.woff2',     url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-900-normal.woff2' },

  { dest: 'public/fonts/jetbrains-mono/JetBrainsMono-Regular.woff2',  url: 'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/files/jetbrains-mono-latin-400-normal.woff2' },
  { dest: 'public/fonts/jetbrains-mono/JetBrainsMono-Medium.woff2',   url: 'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/files/jetbrains-mono-latin-500-normal.woff2' },
  { dest: 'public/fonts/jetbrains-mono/JetBrainsMono-SemiBold.woff2', url: 'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/files/jetbrains-mono-latin-600-normal.woff2' },
];

const WOFF2_SIGNATURE = Buffer.from([0x77, 0x4f, 0x46, 0x32]); // 'wOF2'
const MIN_FONT_SIZE = 1024;

async function isValidWoff2(filePath) {
  try {
    const stats = await fsPromises.stat(filePath);
    if (stats.size < MIN_FONT_SIZE) return false;
    const fd = await fsPromises.open(filePath, 'r');
    const buf = Buffer.alloc(4);
    await fd.read(buf, 0, 4, 0);
    await fd.close();
    return Buffer.compare(buf, WOFF2_SIGNATURE) === 0;
  } catch {
    return false;
  }
}

function downloadFile(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    const cleanup = (err) => {
      file.destroy();
      fsPromises.unlink(dest).catch(() => {}).then(() => reject(err));
    };

    const req = https.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.destroy();
        fsPromises.unlink(dest).catch(() => {}).then(() => {
          if (redirects >= 5) return reject(new Error(`Too many redirects for ${url}`));
          downloadFile(res.headers.location, dest, redirects + 1).then(resolve).catch(reject);
        });
        return;
      }
      if (res.statusCode !== 200) {
        return cleanup(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.on('error', cleanup);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });

    req.on('timeout', () => { req.destroy(); cleanup(new Error(`Timeout for ${url}`)); });
    req.on('error', cleanup);
  });
}

async function downloadFonts() {
  console.log('Downloading fonts...');

  const failures = [];

  for (const { dest, url } of FONTS) {
    const absPath = path.join(rootDir, dest);
    const filename = path.basename(dest);

    fs.mkdirSync(path.dirname(absPath), { recursive: true });

    if (await isValidWoff2(absPath)) {
      console.log(`  ✓ ${filename} (already exists)`);
      continue;
    }

    // Remove invalid/stub file before download
    try { await fsPromises.unlink(absPath); } catch { /* ok */ }

    try {
      await downloadFile(url, absPath);
      if (!await isValidWoff2(absPath)) {
        await fsPromises.unlink(absPath).catch(() => {});
        throw new Error('downloaded file failed woff2 validation');
      }
      console.log(`  ✓ Downloaded ${filename}`);
    } catch (err) {
      console.error(`  ✗ Failed to download ${filename}: ${err.message}`);
      failures.push(filename);
    }
  }

  console.log('Font download complete.');

  if (failures.length > 0) {
    const unique = [...new Set(failures)];
    console.error(`Error: ${unique.length} font(s) failed to download: ${unique.join(', ')}`);
    process.exit(1);
  }

  console.log(`Success: All fonts downloaded.`);
}

downloadFonts().catch((err) => {
  console.error('Error downloading fonts:', err);
  process.exit(1);
});
