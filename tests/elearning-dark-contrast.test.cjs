const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync, existsSync } = require('node:fs');
const { resolve, dirname } = require('node:path');
const { pathToFileURL } = require('node:url');
const { createRequire } = require('node:module');
const root = process.env.MAIRIE_THEME_ROOT || resolve(__dirname, '..');
const load = createRequire(resolve(root, 'package.json'));
const { JSDOM } = load('jsdom');
const postcss = load('postcss');
const { transform, Features } = load('lightningcss');
const markup = `<body class="mairie-ui"><div class="elearning-shell"><main><section class="elearning-catalog-shell bg-[#f4f2ef] text-[#2f3747]"><div><div><div><h2 id="catalog-title">Formations</h2><p id="catalog-subtitle" class="text-base leading-6 text-[#5f6470]">Catalogue communal</p></div></div><article class="flex h-full flex-col rounded-lg border border-[#d8d2ca] bg-white p-6 text-[#2f3747]"><button type="button"><svg id="poster-icon" class="size-12 text-[#4b908d]" stroke="currentColor" fill="none"><path d="M2 2h10v10H2z"></path></svg></button><h3 id="card-title" class="font-bold">RGPD et collectivités</h3><p id="description" class="mt-3 min-h-12 text-sm leading-5 text-[#5f6470]">Une formation pour votre mairie.</p><div class="mt-5 flex items-center justify-between gap-4 text-sm text-[#5f6470]"><span id="author">Alice Martin</span></div><span id="not-started" class="border-[#d8d2ca] bg-[#f4f2ef] text-[#5f6470]">Non commencée</span><button id="primary" class="bg-[#1256a6] text-white">Commencer</button><span id="teal-status" class="border-[#4b908d] bg-[#4b908d] text-white">En cours</span></article><div class="text-[#2f3747]"><span id="stat">3 formations</span><select id="select"><option>Toutes les catégories</option></select></div></div>
<div class="fixed inset-0"><div role="dialog" aria-modal="true" aria-label="Détails et contenu du cours" class="max-h-[calc(100vh-2rem)] w-full max-w-[960px] overflow-y-auto rounded-lg border border-[#d8d2ca] bg-[#f8f7f5] p-6 text-[#2f3747] shadow-2xl"><div class="rounded-md bg-black p-5 text-white"><div><div><p id="reader-format" class="text-sm font-semibold leading-5">Vidéo</p><p id="reader-placeholder" class="mt-1 break-words text-base font-semibold leading-6">Contenu de la formation</p></div></div></div><header class="flex items-start justify-between gap-4"><div><h2 id="reader-title" class="text-xl font-bold leading-7 text-[#2f3747]">RGPD et collectivités</h2><p id="subtitle" class="mt-1 text-sm leading-5 text-[#6f6f6f]">Détails et contenu du cours</p></div></header><p id="reader-error" class="mt-4 text-sm">La formation n’a pas pu être démarrée.</p><div><aside><h3 class="text-[#2f3747]">Chapitres</h3><button class="flex min-h-[58px] w-full items-start gap-3 rounded-md border px-3 py-3 text-left border-[#1256a6] bg-[#e9f1fb] shadow-sm"><p id="chapter-title" class="break-words text-sm font-semibold leading-5 text-[#2f3747]">Chapitre 41</p><div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-4 text-[#6f6f6f]"><span id="chapter-duration">10 min</span></div></button><div class="text-sm leading-5 text-[#2f3747]"><span id="progress-label">Progression totale</span></div><section class="rounded-lg border border-[#d8d2ca] bg-white p-4 text-[#2f3747]"><h3 id="reviews" class="text-sm font-bold">Avis des participants</h3></section></aside><div><p id="reader-description" class="mt-3 text-sm leading-6 text-[#6f6f6f]">Description de la formation</p><article class="flex items-start gap-3 rounded-md border bg-white p-3"><span id="content-type" class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase leading-4 text-[#4b908d]">Vidéo - 5 min</span></article><div id="accent-action" class="bg-[#e9f1fb] text-[#1256a6]">Lire le chapitre</div><div id="neutral-content" class="bg-[#fbfaf9] text-[#5f6470]">Ressource pédagogique</div></div></div></div></div></section></main><footer class="app-accessible-footer bg-white text-[#4c5258]"><a id="help" href="/help" class="text-sm font-medium text-[#4c5258] transition-colors hover:text-[#1256a6]">Aide</a><a id="help-hover" href="/help" class="qa-hover text-[#4c5258] hover:text-[#1256a6]">Aide</a><a id="help-focus" href="/help" class="qa-focus-visible text-[#4c5258] hover:text-[#1256a6] focus-visible:outline-none">Aide</a></footer></div></body>`;

async function screen(theme, viewport = 1280) {
  const { compile } = load('tailwindcss');
  const globals = readFileSync(resolve(root, 'src/app/globals.css'), 'utf8');
  const municipalPath = process.env.MAIRIE_THEME_FILE || resolve(root, existsSync(resolve(root, 'src/styles/municipal-theme.css')) ? 'src/styles/municipal-theme.css' : 'src/app/municipal-theme.css');
  const municipal = readFileSync(municipalPath, 'utf8');
  const dom = new JSDOM(`<html data-theme="${theme}"><head></head>${markup}</html>`);
  dom.window.document.documentElement.setAttribute('data-qa-municipal', 'true');
  // Model this ancestor selector with DOM traversal: this JSDOM version fails
  // to backtrack a descendant after > div:first-child (Chrome matches it).
  // Keep the fixture's actual catalogue header and backdrop/dialog hierarchy.
  dom.window.document.querySelectorAll('.elearning-catalog-shell').forEach(catalogue => {
    [...catalogue.children].filter(node => node.tagName === 'DIV').forEach(container => {
      const first = container.firstElementChild;
      if (first?.tagName === 'DIV') first.querySelectorAll('p').forEach(paragraph => paragraph.setAttribute('data-qa-catalogue-description', ''));
    });
  });
  const classes = [...dom.window.document.querySelectorAll('[class]')].flatMap(element => [...element.classList]);
  const style = dom.window.document.createElement('style');
  const compiled = (await compile(`${globals}\n${municipal}`, {
    base: resolve(root, 'src/app'),
    loadStylesheet: async (id, base) => {
      const path = id === 'tailwindcss' ? load.resolve('tailwindcss/index.css') : id.startsWith('.') || id.startsWith('/') ? resolve(base, id) : load.resolve(id);
      return { path, base: dirname(path), content: readFileSync(path, 'utf8') };
    },
    loadModule: async id => ({ path: load.resolve(id), base: root, module: (await import(pathToFileURL(load.resolve(id)).href)).default }),
  })).build(classes);
  // JSDOM does not apply layered utility priority reliably. Keep the compiler's
  // layer order while exposing the declarations to its CSS cascade.
  const parsed = postcss.parse(transform({ filename: 'projects-contrast.css', code: Buffer.from(compiled), include: Features.Nesting }).code.toString());
  // LightningCSS coalesces outline longhands; JSDOM does not consistently
  // cascade the resulting shorthand against utility outline-style. Expand its
  // solid pixel outline without changing the browser-equivalent declarations.
  parsed.walkDecls('outline', declaration => {
    const outline = /^(\d+(?:\.\d+)?px)\s+solid(?:\s+(.+))?$/.exec(declaration.value);
    if (!outline) return;
    declaration.cloneBefore({ prop: 'outline-width', value: outline[1] });
    declaration.cloneBefore({ prop: 'outline-style', value: 'solid' });
    declaration.cloneBefore({ prop: 'outline-color', value: outline[2] || 'currentColor' });
    declaration.remove();
  });
  const layers = [];
  parsed.walkAtRules('layer', rule => {
    rule.params.split(',').map(name => name.trim()).filter(Boolean).forEach(name => { if (!layers.includes(name)) layers.push(name); });
  });
  const importantLayers = new WeakMap();
  parsed.walkDecls(declaration => {
    if (!declaration.important || !['background', 'background-color'].includes(declaration.prop)) return;
    let ancestor = declaration.parent; let layer;
    while (ancestor) { if (ancestor.type === 'atrule' && ancestor.name === 'layer') { layer = ancestor.params.trim(); break; } ancestor = ancestor.parent; }
    importantLayers.set(declaration, layer === undefined ? Infinity : layers.indexOf(layer));
  });
  parsed.walkAtRules('layer', rule => rule.replaceWith(...(rule.nodes ?? [])));
  // There is no DaisyUI theme-controller input in this fixture. Its :has rules
  // cannot match; omit them because older JSDOM misparses escaped ! utilities
  // when evaluating those unrelated selectors. Explicit data-theme rules stay.
  parsed.walkRules(rule => {
    rule.selector = rule.selector.replaceAll('.elearning-catalog-shell > div > div:first-child p', 'p[data-qa-catalogue-description][data-qa-catalogue-description]');
    // The fixture body is municipal; preserve the :has rule's specificity while
    // avoiding the same older JSDOM escaped-class bug for this known condition.
    rule.selector = rule.selector.replaceAll('html:has(body.mairie-ui)', 'html[data-qa-municipal="true"]');
    const selectors = rule.selectors.filter(selector => !selector.includes('.theme-controller'));
    if (selectors.length) rule.selectors = selectors; else rule.remove();
  });
  // Model a hover-capable pointer explicitly; JSDOM has no native pointer media.
  parsed.walkAtRules('media', rule => {
    if (rule.params === '(hover: hover)') { rule.replaceWith(...(rule.nodes ?? [])); return; }
    const width = /^\(width\s*(>=|>|<=|<)\s*(\d+(?:\.\d+)?)(px|rem)\)$/.exec(rule.params);
    const legacy = /^\((min|max)-width:\s*(\d+(?:\.\d+)?)(px|rem)\)$/.exec(rule.params);
    if (!width && !legacy) return;
    const operator = width ? width[1] : legacy[1] === 'min' ? '>=' : '<=';
    const bound = Number((width || legacy)[2]) * ((width || legacy)[3] === 'rem' ? 16 : 1);
    const matches = operator === '>=' ? viewport >= bound : operator === '>' ? viewport > bound : operator === '<=' ? viewport <= bound : viewport < bound;
    if (matches) rule.replaceWith(...(rule.nodes ?? [])); else rule.remove();
  });
  parsed.walkRules(rule => { rule.selector = rule.selector.replaceAll(':hover', '.qa-hover').replaceAll(':focus-visible', '.qa-focus-visible'); });
  const importantBackgrounds = [];
  parsed.walkDecls(declaration => {
    if (declaration.important && ['background', 'background-color'].includes(declaration.prop)) importantBackgrounds.push({ rule: declaration.parent, rank: importantLayers.get(declaration) });
  });
  style.textContent = parsed.toString();
  dom.window.document.head.append(style);
  const computed = element => { try { return dom.window.getComputedStyle(element); } catch (error) { throw new Error(`${element.id}: ${error.name}: ${error.message}`, { cause: error }); } };
  // JSDOM drops shorthand backgrounds containing var(), unlike browsers.
  // Resolve only the actual active colour tokens before applying its cascade.
  const tokens = computed(dom.window.document.documentElement);
  const resolveTokens = css => css.replace(/var\((--mairie-[\w-]+)\)/g, (match, name) => {
    const value = tokens.getPropertyValue(name).trim();
    return /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value) ? value : match;
  });
  style.textContent = resolveTokens(style.textContent);
  // Important declarations reverse layer order: base beats utilities, and any
  // named layer beats unlayered !important. Flattening without this step gives
  // a false positive for escaped !bg utilities (confirmed in native Chrome).
  // Keep JSDOM's selector specificity/order only within the winning layer.
  const layeredBackground = element => {
    const matches = rule => rule.selectors.some(selector => !/::|:(?:before|after|first-letter|first-line)\b/.test(selector) && element.matches(selector));
    const applicable = importantBackgrounds.filter(candidate => matches(candidate.rule));
    if (!applicable.length) return computed(element).backgroundColor;
    const strongest = Math.min(...applicable.map(candidate => candidate.rank));
    const adjusted = parsed.clone(); let index = 0;
    adjusted.walkDecls(declaration => {
      if (!['background', 'background-color'].includes(declaration.prop)) return;
      // Important declarations also beat all normal declarations, regardless
      // of layer or selector specificity (older JSDOM misses this as well).
      if (!declaration.important) { if (declaration.parent.type === 'rule' && matches(declaration.parent)) declaration.remove(); return; }
      const candidate = importantBackgrounds[index++];
      if (candidate.rank > strongest && matches(declaration.parent)) declaration.remove();
    });
    const previous = style.textContent;
    try { style.textContent = resolveTokens(adjusted.toString()); return computed(element).backgroundColor; }
    finally { style.textContent = previous; }
  };
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
      const value = layeredBackground(current);
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
test('light Elearning keeps unrelated surfaces while footer and metadata reach AA', async () => {
  const view = await screen('light');
  try {
    assert.deepEqual(view.colour('description'), [95, 100, 112]);
    assert.ok(view.contrast('help') >= 4.5);
    assert.ok(view.contrast('chapter-duration') >= 4.5);
    assert.ok(view.contrast('content-type') >= 4.5);
    assert.deepEqual(view.background('reader-error'), [248, 247, 245]);
    assert.deepEqual(view.background('reader-title'), [251, 250, 249]);
    assert.deepEqual(view.background('accent-action'), [233, 241, 251]);
  } finally { view.dom.window.close(); }
});

for (const theme of ['light','dark']) for (const width of [1280,320]) test(`${theme}: real Elearning footer normal/hover/focus stays readable at ${width}px`, async () => {
  const view = await screen(theme,width); try { for (const id of ['help','help-hover','help-focus']) assert.ok(view.contrast(id)>=4.5, `${id}: ${view.contrast(id).toFixed(2)}`); const focus=view.dom.window.getComputedStyle(view.dom.window.document.getElementById('help-focus')); assert.equal(focus.outlineStyle,'solid'); assert.ok(parseFloat(focus.outlineWidth)>=2); } finally { view.dom.window.close(); }
});
for (const theme of ['light','dark']) test(`${theme}: catalogue title style stays scoped to the real header and never recolours reader paragraphs`, async () => {
  const view=await screen(theme); try { for (const id of ['reader-format','reader-placeholder']) { assert.deepEqual(view.colour(id),[255,255,255]); assert.ok(view.contrast(id)>=4.5); } assert.equal(view.dom.window.getComputedStyle(view.dom.window.document.getElementById('catalog-subtitle')).fontSize,'18px'); } finally { view.dom.window.close(); }
});
