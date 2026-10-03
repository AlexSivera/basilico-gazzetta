// Image pipeline (dev only): node tools/images.mjs <sourceDir>
// Requires sharp (npm i -D sharp). Source = original photos downloaded for the demo.
// Outputs responsive WebP in assets/img/<name>-<w>.webp
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_PATH || 'sharp');

const SRC = process.argv[2];
const OUT = path.resolve('assets/img');
fs.mkdirSync(OUT, { recursive: true });

// name: [source file, widths]
const MAP = {
  'mesa-italovalenciana': ['gm2/r045.jpg', [800, 1600]],
  'pizza-rucula': ['gm2/r009.jpg', [700, 1400]],
  'rigatoni-pesto': ['gm2/r011.jpg', [700, 1400]],
  'croquetas-bombin': ['gm2/r005.jpg', [600, 1100]],
  'croquetas-bulldog': ['gm2/r123.jpg', [800, 1600]],
  'tiramisu-moka': ['gm2/r112.jpg', [600, 1000]],
  'patatas-sarten': ['gm2/r040.jpg', [700, 1400]],
  'croquetas-fiambrera': ['gm2/r119.jpg', [848]],
  'helado-playa': ['gm2/r036.jpg', [600, 1000]],
  'ajedrez': ['gm2/r107.jpg', [700, 1400]],
  'techo-periodicos': ['gm2/r014.jpg', [800, 1400]],
  'mural': ['gm2/r010.jpg', [800, 1600]],
  'bici': ['gm2/r047.jpg', [1024]],
  'chimenea': ['gm2/r121.jpg', [800, 1600]],
  'fachada-noche': ['gm2/r007.jpg', [800, 1600]],
  'interior': ['gm2/r030.jpg', [600, 1000]],
  'terraza-noche': ['gm2/r042.jpg', [600, 1000]],
  'croquetas-periodico': ['gm2/r038.jpg', [700, 1400]],
  'pan-pesto': ['gm2/r091.jpg', [600, 1000]],
  'burrata': ['gm2/r067.jpg', [600, 1000]],
  'napolitana': ['gm2/r024.jpg', [600, 1000]],
  'pinsa-padron': ['gm2/r017.jpg', [800, 1600]],
  'gratinado': ['gm2/r086.jpg', [600, 1000]],
  'tagliatelle-almejas': ['gm2/r056.jpg', [600, 1100]],
  'chuleton': ['gm2/r087.jpg', [700, 1300]],
  'gambas': ['gm2/r101.jpg', [700, 1400]],
  'tarta-queso': ['gm2/r090.jpg', [800, 1600]],
  'torrija': ['gm2/r037.jpg', [600, 1000]],
  'pizza-romana': ['gm2/r054.jpg', [600, 1000]],
  'costillas': ['gm2/r097.jpg', [700, 1400]],
  'pinsa-periodico': ['gm2/r106.jpg', [700, 1400]],
  'spritz-terraza': ['sp/s0.jpg', [800, 1600]],
};

for (const [name, [file, widths]] of Object.entries(MAP)) {
  const input = path.join(SRC, file);
  for (const w of widths) {
    const out = path.join(OUT, `${name}-${w}.webp`);
    await sharp(input)
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .modulate({ brightness: 1.02, saturation: 1.06 })
      .sharpen({ sigma: 0.6 })
      .webp({ quality: 72, effort: 5 })
      .toFile(out);
  }
  const meta = await sharp(input).rotate().metadata();
  console.log(name.padEnd(22), `${meta.width}x${meta.height}`, widths.join('/'));
}
