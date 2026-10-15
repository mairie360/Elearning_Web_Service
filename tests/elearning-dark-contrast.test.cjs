const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve, dirname } = require('node:path');
const { JSDOM } = require('jsdom');
const postcss = require('postcss');

const root = resolve(__dirname, '..');
const markup = `<body class="mairie-ui"><div class="elearning-shell"><main><section class="elearning-catalog-shell bg-[#f4f2ef] text-[#2f3747]"><div><div><h2 id="catalog-title">Formations</h2></div><article class="flex h-full flex-col rounded-lg border border-[#d8d2ca] bg-white p-6 text-[#2f3747]"><button type="button"><svg id="poster-icon" class="size-12 text-[#4b908d]" stroke="currentColor" fill="none"><path d="M2 2h10v10H2z"></path></svg></button><h3 id="card-title" class="font-bold">RGPD et collectivités</h3><p id="description" class="mt-3 min-h-12 text-sm leading-5 text-[#5f6470]">Une formation pour votre mairie.</p><div class="mt-5 flex items-center justify-between gap-4 text-sm text-[#5f6470]"><span id="author">Alice Martin</span></div><span id="not-started" class="border-[#d8d2ca] bg-[#f4f2ef] text-[#5f6470]">Non commencée</span><button id="primary" class="bg-[#1256a6] text-white">Commencer</button><span id="teal-status" class="border-[#4b908d] bg-[#4b908d] text-white">En cours</span></article><div class="text-[#2f3747]"><span id="stat">3 formations</span><select id="select"><option>Toutes les catégories</option></select></div></div>
<div role="dialog" aria-modal="true" aria-label="Détails et contenu du cours" class="max-h-[calc(100vh-2rem)] w-full max-w-[960px] overflow-y-auto rounded-lg border border-[#d8d2ca] bg-[#f8f7f5] p-6 text-[#2f3747] shadow-2xl"><header class="flex items-start justify-between gap-4"><div><h2 id="reader-title" class="text-xl font-bold leading-7 text-[#2f3747]">RGPD et collectivités</h2><p id="subtitle" class="mt-1 text-sm leading-5 text-[#6f6f6f]">Détails et contenu du cours</p></div></header><p id="reader-error" class="mt-4 text-sm">La formation n’a pas pu être démarrée.</p><div><aside><h3 class="text-[#2f3747]">Chapitres</h3><button class="flex min-h-[58px] w-full items-start gap-3 rounded-md border px-3 py-3 text-left border-[#1256a6] bg-[#e9f1fb] shadow-sm"><p id="chapter-title" class="break-words text-sm font-semibold leading-5 text-[#2f3747]">Chapitre 41</p><div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-4 text-[#6f6f6f]"><span id="chapter-duration">10 min</span></div></button><div class="text-sm leading-5 text-[#2f3747]"><span id="progress-label">Progression totale</span></div><section class="rounded-lg border border-[#d8d2ca] bg-white p-4 text-[#2f3747]"><h3 id="reviews" class="text-sm font-bold">Avis des participants</h3></section></aside><div><p id="reader-description" class="mt-3 text-sm leading-6 text-[#6f6f6f]">Description de la formation</p><article class="flex items-start gap-3 rounded-md border bg-white p-3"><span id="content-type" class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase leading-4 text-[#4b908d]">Vidéo - 5 min</span></article><div id="accent-action" class="bg-[#e9f1fb] text-[#1256a6]">Lire le chapitre</div><div id="neutral-content" class="bg-[#fbfaf9] text-[#5f6470]">Ressource pédagogique</div></div></div></div></section></main><footer class="bg-white text-[#4c5258]"><a id="help" href="/help" class="text-sm font-medium text-[#4c5258] transition-colors hover:text-[#1256a6]">Aide</a></footer></div></body>`;

async function screen(theme) {
  const { compile } = await import('tailwindcss');
  const globals = readFileSync(resolve(root, 'src/app/globals.css'), 'utf8');
  const municipal = readFileSync(resolve(root, 'src/app/municipal-theme.css'), 'utf8');
  const dom = new JSDOM(`<html data-theme="${theme}"><head></head>${markup}</html>`);
  const classes = [...dom.window.document.querySelectorAll('[class]')].flatMap(element => [...element.classList]);
  const style = dom.window.document.createElement('style');
  const compiled = (await compile(`${globals}\n${municipal}`, {
    base: root,
    loadStylesheet: async (id, base) => {
      const path = id === 'tailwindcss' ? require.resolve('tailwindcss/index.css') : resolve(base, id);
      return { path, base: dirname(path), content: readFileSync(path, 'utf8') };
    },
    loadModule: async id => ({ path: require.resolve(id), base: root, module: (await import(id)).default }),
  })).build(classes);
  // JSDOM does not apply layered utility priority reliably. Keep the compiler's
  // layer order while exposing the declarations to its CSS cascade.
  const parsed = postcss.parse(compiled);
  parsed.walkAtRules('layer', rule => rule.replaceWith(...(rule.nodes ?? [])));
  style.textContent = parsed.toString();
  dom.window.document.head.append(style);
  const computed = element => dom.window.getComputedStyle(element);
  // JSDOM drops shorthand backgrounds containing var(), unlike browsers.
  // Resolve only the actual active colour tokens before applying its cascade.
  for (const [prefix, element] of [['mairie', dom.window.document.documentElement]]) {
    const tokens = computed(element);
    style.textContent = style.textContent.replace(new RegExp(`var\\((--${prefix}-[\\w-]+)\\)`, 'g'), (match, name) => {
      const value = tokens.getPropertyValue(name).trim();
      return /^#[\da-f]{6}$/i.test(value) ? value : match;
    });
  }
  const variable = (element, name) => {
    for (let current = element; current; current = current.parentElement) {
      const value = computed(current).getPropertyValue(name).trim();
      if (value) return value;
    }
    return '';
  };
  const colour = (value, element) => {
    for (let pass = 0; pass < 10 && value.includes('var('); ++pass) value = value.replace(/var\((--[\w-]+)(?:,\s*([^)]*))?\)/g, (_match, name, fallback) => variable(element, name) || fallback || '');
    if (/^#[\da-f]{3}$/i.test(value)) value = '#' + [...value.slice(1)].map(char => char + char).join('');
    if (/^#[\da-f]{6}$/i.test(value)) return [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16));
    const rgb = /^rgb[a]?\((\d+)[, ]+(\d+)[, ]+(\d+)/.exec(value);
    assert.ok(rgb, `Expected an applied solid colour, received ${value}`);
    return rgb.slice(1, 4).map(Number);
  };
  const background = element => {
    for (let current = element; current; current = current.parentElement) {
      const value = computed(current).backgroundColor;
      if (value && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)') return colour(value, current);
    }
    throw new Error('No rendered background');
  };
  const luminance = channels => channels.map(channel => channel / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return {
    dom,
    colour: id => colour(computed(dom.window.document.getElementById(id)).color, dom.window.document.getElementById(id)),
    background: id => background(dom.window.document.getElementById(id)),
    contrast(id) {
      const element = dom.window.document.getElementById(id);
      const pair = [luminance(colour(computed(element).color, element)), luminance(background(element))].sort((a, b) => b - a);
      return (pair[0] + 0.05) / (pair[1] + 0.05);
    },
  };
}

for (const id of ['catalog-title', 'card-title', 'description', 'author', 'not-started', 'stat', 'select', 'reader-title', 'subtitle', 'reader-error', 'chapter-title', 'chapter-duration', 'progress-label', 'reviews', 'reader-description', 'content-type', 'accent-action', 'neutral-content', 'help']) {
  test(`dark rendered Elearning ${id} has AA text contrast on its opaque surface`, async context => {
    const view = await screen('dark');
    try {
      const ratio = view.contrast(id);
      context.diagnostic(`${id}: text rgb(${view.colour(id)}) on rgb(${view.background(id)}), contrast ${ratio.toFixed(2)}:1`);
      assert.ok(ratio >= 4.5, `${id} contrast ${ratio.toFixed(2)} must reach 4.5`);
    } finally { view.dom.window.close(); }
  });
}
test('the Elearning poster icon remains visible without changing primary or coloured status backgrounds', async () => {
  const view = await screen('dark');
  try {
    assert.ok(view.contrast('poster-icon') >= 3);
    assert.deepEqual(view.background('primary'), [18, 86, 166]);
    assert.deepEqual(view.colour('primary'), [255, 255, 255]);
    assert.deepEqual(view.background('teal-status'), [75, 144, 141]);
    assert.deepEqual(view.colour('teal-status'), [255, 255, 255]);
    assert.equal(view.dom.window.document.getElementById('progress-label').className, '');
  } finally { view.dom.window.close(); }
});
test('light Elearning retains its helper, footer, metadata and reader colours', async () => {
  const view = await screen('light');
  try {
    assert.deepEqual(view.colour('description'), [95, 100, 112]);
    assert.deepEqual(view.colour('help'), [76, 82, 88]);
    assert.deepEqual(view.colour('subtitle'), [111, 111, 111]);
    assert.deepEqual(view.colour('content-type'), [75, 144, 141]);
    assert.deepEqual(view.background('reader-error'), [248, 247, 245]);
    assert.deepEqual(view.background('reader-title'), [251, 250, 249]);
    assert.deepEqual(view.background('accent-action'), [233, 241, 251]);
  } finally { view.dom.window.close(); }
});
