// OG images (dev only): node tools/og.mjs  (requires sharp)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_PATH || 'sharp');
const jobs = [
  ['assets/img/mesa-italovalenciana-1600.webp', 'assets/img/og-basilico.jpg'],
  ['assets/img/spritz-terraza-1600.webp', 'assets/img/og-spritz.jpg'],
];
for (const [src, out] of jobs) {
  await sharp(src).resize(1200, 630, { fit: 'cover', position: 'centre' }).jpeg({ quality: 78, mozjpeg: true }).toFile(out);
  console.log('✓', out);
}
