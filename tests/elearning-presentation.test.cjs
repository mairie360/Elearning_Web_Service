const assert = require('node:assert/strict');
const { test } = require('node:test');
const { elearningDom, shadow } = require('./support/elearning-dom.cjs');

test('actual historical catalog retains typography, width preparation and tinted course command', async t => {
  const dom = await elearningDom(t);
  assert.equal(dom.style(dom.document.documentElement).fontSize, '17px');
  assert.equal(dom.style(dom.document.body).fontFamily, 'system-ui, sans-serif');
  const catalog = dom.document.querySelector('.elearning-catalog-shell');
  assert.equal(dom.style(catalog.firstElementChild).maxWidth, 'none');
  assert.equal(dom.style(catalog.querySelector('article > button:first-child')).backgroundColor, 'rgb(239, 246, 255)');
  assert.deepEqual(dom.bff.requests.map(({ method, template }) => `${method} ${template}`), ['GET /elearning/catalog']);
});

test('actual catalog cards keep the shadow binding and reference token values', async t => {
  const dom = await elearningDom(t), article = dom.document.querySelector('.elearning-catalog-shell article');
  // JSDOM keeps var() unresolved: check the actual binding and root token,
  // without claiming native painted-shadow measurement.
  const binding = /^var\((--[\w-]+)\)$/.exec(dom.style(article).boxShadow.trim()); assert.ok(binding);
  assert.deepEqual(shadow(dom.window, dom.style(dom.document.documentElement).getPropertyValue(binding[1])), [
    { lengths: [0, 5, 15, 0], color: 'rgba(23, 32, 51, 0.14)' },
    { lengths: [0, 1, 3, 0], color: 'rgba(23, 32, 51, 0.12)' },
  ]);
});

test('actual published historical sidebar receives reference shadow and seven rows', async t => {
  const dom = await elearningDom(t), sidebar = dom.document.querySelector('aside[aria-label="Navigation principale"]');
  assert.equal(dom.style(sidebar).position, 'relative'); assert.equal(dom.style(sidebar).zIndex, '20');
  assert.deepEqual(shadow(dom.window, dom.style(sidebar).boxShadow), [{ lengths: [8, 0, 24, 0], color: 'rgba(12, 28, 48, 0.28)' }]);
  const buttons = [...sidebar.querySelectorAll('nav button')];
  assert.deepEqual(buttons.map(button => button.textContent), ['Tableau de bord', 'Projets', 'Messagerie', 'Formation', 'Calendrier', 'Administration', 'Paramètres']);
  for (const button of buttons) { assert.equal(dom.style(button).minHeight, '44px'); assert.equal(dom.style(button).flexShrink, '0'); }
});

test('actual published drawer applies its lower layer and closes through its command', async t => {
  const dom = await elearningDom(t); await dom.click(dom.button('Ouvrir la navigation'));
  const drawer = dom.document.querySelector('[role="dialog"][aria-label="Navigation mobile"]'); assert.ok(drawer);
  assert.equal(dom.style(drawer.querySelector('aside')).zIndex, '0');
  await dom.click(dom.button('Fermer la navigation'));
  assert.equal(dom.document.querySelector('[role="dialog"][aria-label="Navigation mobile"]'), null);
});

test('actual course deep link opens the published chapter reader with sticky header and closes it', async t => {
  const dom = await elearningDom(t, { reader: true });
  const reader = dom.document.querySelector('.elearning-catalog-shell [role="dialog"]:has(> div > aside)'); assert.ok(reader);
  assert.ok(reader.querySelector(':scope > div > aside')); const header = reader.querySelector(':scope > header'); assert.ok(header);
  const computed = dom.style(header); assert.equal(computed.position, 'sticky'); assert.equal(computed.top, '-24px'); assert.equal(computed.zIndex, '35');
  assert.equal(computed.backgroundColor, 'rgb(251, 250, 249)'); assert.equal(computed.margin, '-24px -24px 0px'); assert.equal(computed.padding, '20px 24px');
  assert.equal(dom.style(reader).overscrollBehavior, 'contain');
  assert.deepEqual(shadow(dom.window, dom.style(reader).boxShadow), [{ lengths: [0, 20, 60, 0], color: 'rgba(0, 0, 0, 0.32)' }]);
  await dom.click(dom.button('Fermer le détail du cours'));
  assert.ok(!dom.document.querySelector('.elearning-catalog-shell [role="dialog"]:has(> div > aside)'), 'Reader must close');
  assert.ok(dom.bff.requests.every(request => request.method === 'GET'));
  // Native geometry, responsive scrolling, modal focus and hit testing remain separate.
});
