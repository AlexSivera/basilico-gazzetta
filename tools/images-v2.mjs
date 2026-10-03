// Imágenes v2 (dev only): node tools/images-v2.mjs <carpetaOrigen>
// Recortes dirigidos (extract) desde los originales en alta resolución.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_PATH || 'sharp');
const SRC = process.argv[2];
const OUT = path.resolve('assets/img');
fs.mkdirSync(OUT, { recursive: true });

// nombre: { src, crop: [left, top, width, height] (opcional), widths, q }
const JOBS = {
  // Portada: mesa italovalenciana a sangre (escritorio) y recorte vertical (móvil)
  'portada-mesa': { src: 'hi/r045.jpg', crop: [0, 120, 4000, 1600], widths: [1200, 2000, 2800], q: 70 },
  'portada-mesa-m': { src: 'hi/r045.jpg', crop: [0, 470, 1460, 1329], widths: [640, 1000], q: 72 },
  // Tres masas
  'masa-romana': { src: 'hi/r009.jpg', crop: [700, 0, 2250, 3000], widths: [600, 1000], q: 72 },
  'masa-napolitana': { src: 'hi/r024.jpg', crop: [150, 1250, 2800, 2750], widths: [600, 1000], q: 72 },
  'masa-pinsa': { src: 'hi/r017.jpg', crop: [1250, 0, 1500, 1800], widths: [600, 1000], q: 74, boost: true },
  // Carta: fotos de categoría sin repetir las de arriba
  'carta-romanas': { src: 'own/o6.jpg', widths: [700, 1200], q: 72 },
  'carta-napolitanas': { src: 'hi/r054.jpg', crop: [0, 600, 2160, 2700], widths: [700, 1200], q: 72 },
  'carta-pinsas': { src: 'hi/r045.jpg', crop: [1350, 0, 1350, 1799], widths: [700, 1200], q: 72 },
  'patatas-gratinadas': { src: 'own/o7.jpg', widths: [700, 1200], q: 72 },
  // La casa: la barra (foto del propietario)
  'barra': { src: 'own/o5.jpg', widths: [800, 1600], q: 72 },
};

for (const [name, job] of Object.entries(JOBS)) {
  for (const w of job.widths) {
    let img = sharp(path.join(SRC, job.src)).rotate();
    if (job.crop) {
      const [left, top, width, height] = job.crop;
      img = img.extract({ left, top, width, height });
    }
    await img
      .resize({ width: w, withoutEnlargement: true })
      .modulate(job.boost ? { brightness: 1.06, saturation: 1.16 } : { saturation: 1.05 })
      .sharpen({ sigma: 0.5 })
      .webp({ quality: job.q, effort: 5 })
      .toFile(path.join(OUT, `${name}-${w}.webp`));
  }
  console.log('✓', name, job.widths.join('/'));
}
