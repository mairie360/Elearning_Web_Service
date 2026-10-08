const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { ElearningCourseDetailsModal } = require('@mairie360/lib-components');

const css = readFileSync(path.join(__dirname, '../src/app/globals.css'), 'utf8');

test('catalog presentation retains the measured prototype typography and shadows', () => {
  assert.match(css, /html\s*\{\s*font-size:\s*17px;/);
  assert.match(css, /body\s*\{[^}]*font-family:\s*system-ui, sans-serif;/);
  assert.match(css, /\.elearning-catalog-shell article\s*\{\s*box-shadow:\s*var\(--elearning-card-shadow\);/);
  assert.match(css, /\.elearning-catalog-shell article > button:first-child\s*\{\s*background:\s*#eff6ff;/);
});

test('the shared sidebar retains reference target size and shadow without covering mobile close', () => {
  assert.match(css, /\.elearning-shell aside\[aria-label="Navigation principale"\]\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*20;[^}]*box-shadow:\s*8px 0 24px rgb\(12 28 48 \/ 28%\);/);
  assert.match(css, /\.elearning-shell aside\[aria-label="Navigation principale"\] > nav button\s*\{[^}]*min-height:\s*44px;[^}]*flex-shrink:\s*0;/);
  assert.match(css, /\.elearning-shell \[role="dialog"\]\[aria-label="Navigation mobile"\] aside\[aria-label="Navigation principale"\]\s*\{\s*z-index:\s*0;/);
  // DOM/style guards alone do not establish mobile hit-testing or focus return;
  // native desktop/mobile interaction evidence is required before acceptance.
});

test('the installed reader keeps the semantic chapter aside targeted by the scoped sticky header', () => {
  const html = renderToStaticMarkup(React.createElement(ElearningCourseDetailsModal, {
    open: true, title: 'Reader presentation check', description: '', chapters: [], onClose() {},
  }));
  assert.match(html, /role="dialog"[^]*?<header\b[^]*?<\/header>\s*<div[^>]*grid[^>]*>[^]*?<aside\b/);
  assert.match(html, /aria-label="Fermer le détail du cours"/);
  assert.match(css, /\[role="dialog"\]:has\(> div > aside\) > header\s*\{\s*position:\s*sticky;\s*top:\s*-24px;/);
  assert.match(css, /@media \(max-width: 767px\)[^]*?\[role="dialog"\]:has\(> div > aside\)\s*\{\s*padding:\s*16px;/);
  assert.match(css, /top:\s*-16px;\s*margin:\s*-16px -16px 0;\s*padding:\s*16px;/);
  // These markup/style checks guard the published component selector. Native
  // desktop/mobile scrolling and closure remain required rendered evidence.
});
