// Build sin dependencias: node tools/build.mjs
// Vuelca data/*.json dentro de los marcadores <!-- build:x --> ... <!-- /build:x --> de los HTML.
// Así la carta y los menús quedan en el HTML (SEO, sin JS) y se editan desde los JSON.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const norm = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const IMG_W = {}; // nombre -> anchos disponibles
for (const f of fs.readdirSync(path.join(root, 'assets/img'))) {
  const m = f.match(/^(.+)-(\d+)\.webp$/);
  if (m) (IMG_W[m[1]] ||= []).push(+m[2]);
}
for (const k in IMG_W) IMG_W[k].sort((a, b) => a - b);

export function img(name, { alt = '', altEn = '', sizes = '100vw', cls = '', eager = false } = {}) {
  const ws = IMG_W[name];
  if (!ws) throw new Error(`Imagen no encontrada: ${name}`);
  const srcset = ws.map((w) => `assets/img/${name}-${w}.webp ${w}w`).join(', ');
  const src = `assets/img/${name}-${ws[0]}.webp`;
  return `<img src="${src}" srcset="${srcset}" sizes="${sizes}" alt="${esc(alt)}"${altEn ? ` data-en-alt="${esc(altEn)}"` : ''}${cls ? ` class="${cls}"` : ''} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

const TAG = {
  fav: { es: 'Favorito', en: 'Fan favourite' },
  iv: { es: 'Italovalenciano', en: 'Italo-Valencian' },
};
const tagHtml = (tags = []) => tags.map((t) =>
  `<span class="tag tag--${t}" data-en="${esc(TAG[t].en)}">${TAG[t].es}</span>`).join('');

function dish(d) {
  const search = norm([d.name, d.es, d.en].join(' '));
  const price = d.price
    ? `<span class="dish__price">${esc(d.price)}</span>`
    : `<span class="dish__price dish__price--ask" data-en="Ask">Consultar</span>`;
  return `<li class="dish" data-search="${esc(search)}">
          <div class="dish__head"><span class="dish__name">${esc(d.name)}</span>${tagHtml(d.tags)}<span class="dish__leader" aria-hidden="true"></span>${price}</div>
          <p class="dish__desc" data-en="${esc(d.en || '')}">${esc(d.es || '')}</p>
        </li>`;
}

const countOf = (s) => (s.items ? s.items.length : s.subsections.reduce((m, x) => m + x.items.length, 0));

function section(s) {
  const list = (items) => `<ul class="dishes" role="list">\n        ${items.map(dish).join('\n        ')}\n      </ul>`;
  let body = '';
  if (s.subsections) {
    body = s.subsections.map((sub) => `
      <div class="carta-sub">
        <h4 class="carta-sub__title" data-en="${esc(sub.en)}">${esc(sub.es)}</h4>
        ${list(sub.items)}
      </div>`).join('');
  } else {
    body = list(s.items);
  }
  if (s.pastaTypes) {
    body += `
      <div class="pasta-types">
        <p class="pasta-types__label" data-en="Fresh egg pasta to pair with any homemade sauce">Pasta al huevo para combinar con nuestras salsas caseras</p>
        <ul class="pasta-types__list" role="list">${s.pastaTypes.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
      </div>`;
  }
  const fig = s.img ? `
      <figure class="carta-sec__fig">
        ${img(s.img, { alt: s.img_alt_es, altEn: s.img_alt_en, sizes: '(min-width: 1000px) 30vw, 92vw' })}
      </figure>` : '';
  const note = s.note_es ? `<p class="carta-sec__note" data-en="${esc(s.note_en)}">${esc(s.note_es)}</p>` : '';
  return `
    <section class="carta-sec${s.img ? ' has-fig' : ''}" id="c-${s.id}" data-cat="${s.id}" aria-labelledby="h-${s.id}">
      <header class="carta-sec__head">
        <h3 class="carta-sec__title" id="h-${s.id}" data-en="${esc(s.en)}">${esc(s.es)}</h3>
        ${tagHtml(s.tags)}${note}
      </header>${fig}
      <div class="carta-sec__body">${body}
      </div>
    </section>`;
}

// Índice de secciones: enlaces normales (sin JS saltan a la sección);
// con JS funcionan como pestañas y muestran una sección cada vez.
function carta(data) {
  const idx = data.sections.map((s) =>
    `<li><a class="cidx" href="#c-${s.id}" data-cat="${s.id}"><span data-en="${esc(s.en)}">${esc(s.es)}</span><b>${countOf(s)}</b></a></li>`).join('\n          ');
  return `
      <nav class="carta-index" aria-label="Secciones de la carta" data-en-aria-label="Menu sections">
        <ul class="carta-index__list" role="list">
          ${idx}
        </ul>
      </nav>
      <div class="carta-secs">${data.sections.map((s) => section(s)).join('\n')}
      </div>`;
}

function menus(list) {
  return list.map((m) => `
      <article class="menu-card" data-menu="${m.id}" data-from="${m.validFrom}" data-to="${m.validTo}">
        <header class="menu-card__head">
          <p class="menu-card__state" data-state></p>
          <h3 class="menu-card__title" data-en="${esc(m.en)}">${esc(m.es)}</h3>
          <p class="menu-card__when" data-en="${esc(m.when_en)}">${esc(m.when_es)}</p>
          <p class="menu-card__price"><span>${esc(m.price)}</span><small data-en="per person">por persona</small></p>
        </header>
        ${m.courses.map((c) => `
        <div class="menu-card__course">
          <h4 data-en="${esc(c.en)}">${esc(c.es)}</h4>
          <ul role="list">${c.items.map((it) => `<li data-en="${esc(it.en)}">${esc(it.es)}</li>`).join('')}</ul>
        </div>`).join('')}
        <p class="menu-card__incl"><strong data-en="Includes">Incluye</strong> <span data-en="${esc(m.includes_en)}">${esc(m.includes_es)}</span></p>
        <p class="menu-card__src" data-edition></p>
      </article>`).join('\n');
}

function inject(file, blocks) {
  const p = path.join(root, file);
  let html = fs.readFileSync(p, 'utf8');
  for (const [name, content] of Object.entries(blocks)) {
    const re = new RegExp(`(<!-- build:${name} -->)[\\s\\S]*?(<!-- /build:${name} -->)`);
    if (!re.test(html)) throw new Error(`Marcador build:${name} no encontrado en ${file}`);
    html = html.replace(re, `$1${content}\n      $2`);
  }
  fs.writeFileSync(p, html);
  console.log('✓', file, Object.keys(blocks).join(', '));
}

const tav = read('data/carta-tavernetta.json');
const spz = read('data/carta-spritz.json');
const men = read('data/menus.json');
const count = (d) => d.sections.reduce((n, s) => n + countOf(s), 0);

inject('index.html', { 'carta-tavernetta': carta(tav), menus: menus(men.tavernetta) });
inject('spritz.html', { 'carta-spritz': carta(spz) });
console.log(`Platos: tavernetta ${count(tav)}, spritz ${count(spz)}`);
