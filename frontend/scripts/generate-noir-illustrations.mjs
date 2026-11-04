import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const outputDir = fileURLToPath(new URL('../public/images/noir/', import.meta.url));
const items = [
  { slug: 'catsuit-eclipse', name: 'Catsuit Eclipse', type: 'Prenda de latex', color: '#872d4d', art: `<path class="item" d="M394 174h112l54 59 93 146-48 39-69-82 13 202-56 177h-65l22-203h-16l22 203h-65l-56-177 13-202-69 82-48-39 93-146z"/><path class="shine" d="m405 183 45 57 45-57M310 270l73 90M590 270l-73 90M430 373l-14 224M472 373l14 224"/>` },
  { slug: 'catsuit-onix', name: 'Catsuit Ónix', type: 'Prenda de látex', color: '#a26d85', art: `<path class="item" d="M396 168h108v42h-108zM396 208h108l54 41 91 131-47 39-70-78 13 209-53 186h-66l22-210h-18l22 210h-66l-53-186 13-209-70 78-47-39 91-131z"/><path class="shine" d="M397 195h106M408 221l38 50 47-50M310 275l77 89M590 275l-77 89M450 283v306"/>` },
  { slug: 'bodysuit-aurora', name: 'Bodysuit Aurora', type: 'Prenda de latex', color: '#83536b', art: `<path class="item" d="M390 183h120l43 68 69 97-41 36-61-53 12 106-44 105H412l-44-105 12-106-61 53-41-36 69-97z"/><path class="shine" d="m392 190 58 74 58-74M330 287l67 51M570 287l-67 51M400 349h100M420 423h60"/>` },
  { slug: 'bodysuit-sombra', name: 'Bodysuit Sombra', type: 'Prenda de latex', color: '#68717c', art: `<path class="item" d="M395 172h110v45H395zM395 217h110l44 54 74 86-40 40-62-57 16 105-48 94H411l-48-94 16-105-62 57-40-40 74-86z"/><path class="shine" d="M396 194h108M406 224l42 53 46-53M333 292l67 52M567 292l-67 52M398 358h104"/>` },
  { slug: 'vestido-nocturna', name: 'Vestido Nocturna', type: 'Prenda de latex', color: '#923550', art: `<path class="item" d="M397 176h106l39 65-7 182 89 181-38 29H309l-38-29 89-181-7-182z"/><path class="shine" d="m399 182 51 75 51-75M389 285h124M359 575h184M380 620h140"/>` },
  { slug: 'vestido-carmesi', name: 'Vestido Carmesí', type: 'Prenda de látex', color: '#a44458', art: `<path class="item" d="M400 170h100l45 68-17 157 95 200-42 35H319l-42-35 95-200-17-157z"/><path class="shine" d="m402 178 48 71 48-71M389 274h122M365 579h166M382 617h132"/>` },
  { slug: 'corse-velvet', name: 'Corsé Velvet', type: 'Corsetería', color: '#9a4d63', art: `<path class="item" d="M382 226q68 35 136 0l-18 348q-50 38-100 0z"/><path class="shine" d="M385 236q65 30 130 0M400 557q50 30 100 0M450 245v313M395 291h110M393 335h114M391 381h118M389 427h122M387 473h126"/>${Array.from({length: 8}, (_, i) => `<circle class="metal" cx="${421 + (i % 2) * 58}" cy="${291 + Math.floor(i / 2) * 62}" r="4"/>`).join('')}` },
  { slug: 'corse-obsidiana', name: 'Corsé Obsidiana', type: 'Corsetería', color: '#766b7c', art: `<path class="item" d="M378 219q72 42 144 0l-14 357q-58 48-116 0z"/><path class="shine" d="M381 229q69 37 138 0M408 569q42 22 84 0M450 239v328M389 291h122M387 342h126M385 394h130M383 446h134M381 498h138"/>${Array.from({length: 8}, (_, i) => `<circle class="metal" cx="${419 + (i % 2) * 62}" cy="${291 + Math.floor(i / 2) * 64}" r="3.5"/>`).join('')}` },
  { slug: 'arnes-geometrico', name: 'Arnés Geométrico', type: 'Arneses y accesorios', color: '#987346', art: `<path class="ghost" d="M366 209q84-58 168 0l47 284q-131 89-262 0z"/><path class="item-line" d="M366 213q84 47 168 0l-34 244q-50 36-100 0zM369 213l131 244M531 213 400 457M366 340h168M379 420h142"/>${Array.from({length: 5}, (_, i) => `<circle class="metal" cx="${394 + i * 28}" cy="${340 + Math.abs(2-i) * 18}" r="5"/>`).join('')}` },
  { slug: 'arnes-minimal', name: 'Arnés Minimal', type: 'Arneses y accesorios', color: '#68817b', art: `<path class="ghost" d="M366 206q84-58 168 0l47 284q-131 89-262 0z"/><path class="item-line" d="M365 210q85 49 170 0M365 210l85 175 85-175M450 385v114M366 328h168"/><circle class="metal" cx="450" cy="385" r="8"/>` },
  { slug: 'choker-meridian', name: 'Choker Meridian', type: 'Arneses y accesorios', color: '#887285', art: `<path class="ghost" d="M378 184q72 42 144 0v223q-72 43-144 0z"/><path class="item-line" d="M379 270q71 34 142 0v57q-71 34-142 0z"/><path class="shine" d="M390 284q60 28 120 0M390 313q60 28 120 0"/><circle class="metal" cx="450" cy="347" r="15"/><path class="item-line" d="M450 362v78l-17 18 17 22 17-22-17-18"/>` },
  { slug: 'munecas-atlas', name: 'Muñequeras Atlas', type: 'Arneses y accesorios', color: '#976447', art: `<g transform="rotate(-13 355 430)"><rect class="item" x="277" y="276" width="150" height="294" rx="36"/><path class="shine" d="M289 300h126M289 545h126"/><rect class="item-line" x="285" y="345" width="134" height="27" rx="7"/><rect class="item-line" x="285" y="476" width="134" height="27" rx="7"/><circle class="metal" cx="352" cy="357" r="8"/></g><g transform="rotate(13 545 430)"><rect class="item" x="473" y="276" width="150" height="294" rx="36"/><path class="shine" d="M485 300h126M485 545h126"/><rect class="item-line" x="481" y="345" width="134" height="27" rx="7"/><rect class="item-line" x="481" y="476" width="134" height="27" rx="7"/><circle class="metal" cx="548" cy="357" r="8"/></g>` },
  { slug: 'guantes-opera', name: 'Guantes Opera', type: 'Guantes y máscaras', color: '#9b6e83', art: `<path class="item" d="M330 625q-18-30-20-95l-12-182q-2-20 13-22t19 20l14 127-7-240q0-23 17-23t19 23l8 216 4-259q1-23 18-22t17 24l-2 256 16-232q2-22 19-20t16 23l-16 260 24-136q4-21 20-17t12 25l-45 225q-11 55-61 63z"/><path class="item" d="M570 625q18-30 20-95l12-182q2-20-13-22t-19 20l-14 127 7-240q0-23-17-23t-19 23l-8 216-4-259q-1-23-18-22t-17 24l2 256-16-232q-2-22-19-20t-16 23l16 260-24-136q-4-21-20-17t-12 25l45 225q11 55 61 63z"/><path class="shine" d="M309 456h70M526 456h70"/>` },
  { slug: 'antifaz-prisma', name: 'Antifaz Prisma', type: 'Guantes y mascaras', color: '#97836a', art: `<path class="item" fill-rule="evenodd" d="M290 333q80-70 160-15 80-55 160 15l-24 111q-19 63-86 22l-50-49-50 49q-67 41-86-22z M326 350q43-29 85 0l-9 48q-38 23-67-6z M489 350q42-29 85 0l-9 42q-29 29-67 6z"/><path class="shine" d="M292 337q76-63 158-12 82-51 158 12"/><circle class="metal" cx="450" cy="411" r="7"/>` },
  { slug: 'cuerda-escenica', name: 'Cuerda Escénica', type: 'Cuerdas decorativas', color: '#bd976c', art: `<path class="item-line" d="M544 286c-45-73-154-82-211-20-61 67-37 174 31 223 78 56 202 27 224-61 19-77-45-143-113-137-63 6-96 71-67 120 24 39 82 44 106 9 18-27 4-65-25-70-21-4-40 13-35 33 4 14 20 20 30 11"/><path class="item-line" d="M256 535c52 83 186 108 277 50 32-21 52-46 61-77"/><circle class="metal" cx="546" cy="286" r="9"/><path class="shine" d="M539 278l15 16M260 530c50 72 161 94 243 55"/>` },
];

const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function render(item, index) {
  const title = escapeXml(item.name);
  const type = escapeXml(item.type);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100" role="img" aria-labelledby="title description">
  <title id="title">Ilustracion original NOIR: ${title}</title>
  <desc id="description">Ilustracion vectorial editorial de ${title}; referencia visual, no fotografia del producto.</desc>
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#27232a"/><stop offset=".55" stop-color="#121115"/><stop offset="1" stop-color="#09090b"/></linearGradient>
    <radialGradient id="halo"><stop stop-color="${item.color}" stop-opacity=".42"/><stop offset="1" stop-color="${item.color}" stop-opacity="0"/></radialGradient>
    <linearGradient id="material" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="${item.color}"/><stop offset=".42" stop-color="#171519"/><stop offset=".78" stop-color="#28232a"/><stop offset="1" stop-color="${item.color}" stop-opacity=".7"/></linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="20"/></filter>
  </defs>
  <rect width="900" height="1100" fill="url(#background)"/><ellipse cx="500" cy="477" rx="380" ry="400" fill="url(#halo)"/>
  <path d="M72 85h756M72 1015h756" stroke="#dfd3dc" stroke-opacity=".18"/><path d="M96 83v18m708-18v18M96 999v18m708-18v18" stroke="#c18ba0" stroke-opacity=".65"/>
  <text x="96" y="144" fill="#c6a7b4" font-family="Arial,sans-serif" font-size="15" letter-spacing="5">NOIR  /  EDITORIAL OBJECT ${String(index + 1).padStart(2, '0')}</text>
  <ellipse cx="450" cy="774" rx="220" ry="32" fill="#000" opacity=".55" filter="url(#shadow)"/>
  <g stroke-linecap="round" stroke-linejoin="round">${item.art}</g>
  <text x="96" y="894" fill="#f5f1ed" font-family="Georgia,serif" font-size="43">${title}</text>
  <text x="98" y="936" fill="#ad9fa7" font-family="Arial,sans-serif" font-size="14" letter-spacing="3">${type.toUpperCase()}</text>
  <text x="98" y="985" fill="#817880" font-family="Arial,sans-serif" font-size="12" letter-spacing="2">ILUSTRACION ORIGINAL · NO ES UNA FOTOGRAFIA</text>
  <style>
    .item{fill:url(#material);stroke:#e8dce2;stroke-opacity:.48;stroke-width:3;filter:drop-shadow(0 22px 24px #0009)}
    .item-line{fill:none;stroke:url(#material);stroke-width:20;filter:drop-shadow(0 16px 17px #0009)}
    .ghost{fill:#171519;stroke:#bca9b2;stroke-opacity:.22;stroke-width:2}
    .shine{fill:none;stroke:#f6e9ef;stroke-opacity:.5;stroke-width:3}
    .metal{fill:#c9b9c1;stroke:#f3e9ed;stroke-width:2}
  </style>
</svg>`;
}

await mkdir(outputDir, { recursive: true });
await Promise.all(items.map((item, index) => writeFile(path.join(outputDir, `${item.slug}.svg`), render(item, index), 'utf8')));
console.log(`Generated ${items.length} original NOIR catalog illustrations in ${outputDir}`);
