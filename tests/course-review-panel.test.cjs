const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
require('./support/load-typescript.cjs');
const { installReactRuntime,mount } = require('./support/server-view.cjs');
installReactRuntime();
const React = require('react');
const { CourseReviewPanel } = require('../src/components/ElearningModule/components/CourseReviewPanel/index.ts');
let view;
afterEach(() => { view?.unmount(); view=null; });
test('a written review draft is retained without misusing the published numeric-rating operation', async () => {
  view=mount(React.createElement(CourseReviewPanel,{ courseId:'c1',completed:true,draft:{ rating:4,comment:'Avis saisi' },onDraftChange:() => {} }));
  await view.settle(); await view.fire((props,text,tag) => tag==='form','onSubmit');
  assert.match(view.text(),/aucun avis n’a été publié/); assert.match(view.html,/Avis saisi/); assert.doesNotMatch(view.text(),/Votre avis a été enregistré/);
});
test('written review displays an attributed receipt only after the future bridge confirms it', async () => {
  let submitted;
  view=mount(React.createElement(CourseReviewPanel,{ courseId:'c1',completed:true,draft:{ rating:4,comment:'Avis saisi' },onDraftChange:() => {},port:{
    listReviews:async () => [],saveReview:async (course,draft) => { submitted={course,draft}; return { id:'review-1',author:'Agent reçu',rating:4,comment:'Avis saisi',updatedAt:'2026-10-11T00:00:00Z' }; }
  } }));
  await view.settle(); await view.fire((props,text,tag) => tag==='form','onSubmit');
  assert.deepEqual(submitted,{ course:'c1',draft:{ rating:4,comment:'Avis saisi' } }); assert.match(view.text(),/Votre avis a été enregistré/); assert.match(view.text(),/Agent reçu/);
});
test('an incomplete written-review receipt does not publish an unverified author or clear the draft', async () => {
  view=mount(React.createElement(CourseReviewPanel,{ courseId:'c1',completed:true,draft:{ rating:4,comment:'Avis saisi' },onDraftChange:() => {},port:{ saveReview:async () => ({ id:'r1',rating:4,comment:'Avis saisi' }) } }));
  await view.settle(); await view.fire((props,text,tag) => tag==='form','onSubmit'); assert.match(view.text(),/n’a pas été confirmé/); assert.doesNotMatch(view.text(),/Votre avis a été enregistré/);
});

test('a delayed initial review list cannot erase a freshly confirmed review', async () => {
  let receive;
  view=mount(React.createElement(CourseReviewPanel,{ courseId:'c1',completed:true,draft:{ rating:4,comment:'Avis saisi' },onDraftChange:() => {},port:{
    listReviews:() => new Promise(resolve => { receive=resolve; }),saveReview:async () => ({ id:'r1',author:'Agent reçu',rating:4,comment:'Avis saisi',updatedAt:'2026-10-11T00:00:00Z' })
  } }));
  await view.settle(); assert.match(view.text(),/Chargement des avis/);
  await view.fire((props,text,tag) => tag==='form','onSubmit');
  receive([]); await view.settle(); assert.match(view.text(),/Agent reçu/); assert.match(view.text(),/Votre avis a été enregistré/);
});
