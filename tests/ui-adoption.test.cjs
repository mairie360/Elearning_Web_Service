const assert = require('node:assert/strict');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');
require('./support/load-typescript.cjs');
const { installReactRuntime, mount } = require('./support/server-view.cjs');
installReactRuntime();
const React = require('react');
const { CourseReviewPanel } = require('../src/components/ElearningModule/components/CourseReviewPanel/index.ts');

test('a confirmed written-review receipt can be dismissed without resubmitting or discarding its attributed review', async t => {
  let confirm;
  const writes = [];
  const view = mount(React.createElement(CourseReviewPanel, {
    courseId: 'course-1', completed: true, draft: { rating: 4, comment: 'Avis conservé' }, onDraftChange() {},
    port: {
      listReviews: async () => [],
      saveReview: (courseId, draft) => {
        writes.push({ courseId, draft });
        return new Promise(resolve => { confirm = resolve; });
      },
    },
  }));
  t.after(() => { view.unmount(); delete global.window; delete global.document; });
  await view.settle();
  const saving = view.fire((_props, _text, tag) => tag === 'form', 'onSubmit');
  await view.settle();
  assert.doesNotMatch(view.text(), /Votre avis a été enregistré/);
  confirm({ id: 'review-1', author: 'Participant reçu', rating: 4, comment: 'Avis conservé', updatedAt: '2026-10-16T00:00:00Z' });
  await saving;
  const dom = new JSDOM(view.html);
  try {
    const notices = [...dom.window.document.querySelectorAll('[role="status"]')]
      .filter(node => node.textContent.includes('Votre avis a été enregistré.'));
    assert.equal(notices.length, 1, 'The completed review has one live announcement.');
    assert.ok(notices[0].querySelector('button[aria-label]'),
      'The review receipt has a dismiss command.');
  } finally { dom.window.close(); }
  const notice = view.hostElements(props => props.role === 'status' && typeof props.onKeyDown === 'function')[0];
  await view.act(() => notice?.props.onKeyDown({ key: 'Escape', preventDefault() {}, stopPropagation() {} }));
  assert.doesNotMatch(view.text(), /Votre avis a été enregistré/);
  assert.match(view.text(), /Participant reçu/);
  assert.match(view.html, /Avis conservé/);
  assert.deepEqual(writes, [{ courseId: 'course-1', draft: { rating: 4, comment: 'Avis conservé' } }]);
});

test('a confirmed empty reviews response exposes a named section instead of claiming unavailability', async t => {
  const view = mount(React.createElement(CourseReviewPanel, {
    courseId: 'course-1', completed: false, draft: { rating: 4, comment: '' }, onDraftChange() {},
    port: { listReviews: async () => [] },
  }));
  t.after(() => { view.unmount(); delete global.window; delete global.document; });
  await view.waitFor(html => html.includes('Aucun avis à afficher.'));
  const dom = new JSDOM(view.html);
  try {
    const document = dom.window.document;
    assert.ok([...document.querySelectorAll('section[aria-labelledby]')]
      .some(node => [...node.querySelectorAll('[id]')].some(heading => heading.id === node.getAttribute('aria-labelledby') && heading.textContent === 'Aucun avis à afficher.')),
    'A successfully read empty list is discoverable as a named section.');
    assert.doesNotMatch(document.body.textContent, /ne sont pas encore disponibles|Chargement des avis/);
  } finally { dom.window.close(); }
});
