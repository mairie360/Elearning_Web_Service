const assert = require('node:assert/strict');
const { test } = require('node:test');
require('./support/load-typescript.cjs');

// MAIR-608: the rules pulled out of the e-learning components while splitting them.
const progress = require('../src/components/elearning/course-details/course-progress.ts');
const rating = require('../src/components/elearning/course-details/course-rating.ts');
const form = require('../src/components/elearning/course-form/course-form-values.ts');
const catalog = require('../src/components/elearning/catalog/catalog-model.ts');

const video = { id: 'v', title: 'Vidéo', type: 'video' };
const optional = { id: 'o', title: 'Bonus', type: 'pdf', required: false };

test('MAIR-608 course progress counts required contents only', () => {
  const chapters = progress.normalizeChaptersForProgress([
    { id: 'a', title: 'A', duration: '', completed: true, contents: [video] },
    { id: 'b', title: 'B', duration: '', contents: [{ ...video, id: 'w' }, optional] },
  ]);
  assert.equal(chapters[0].contents[0].completed, true);
  const summary = progress.getElearningCourseProgressSummary(chapters);
  assert.deepEqual([summary.progress, summary.completedRequiredContents, summary.totalRequiredContents, summary.completedChapters, summary.completed], [50, 1, 2, 1, false]);
  assert.equal(progress.getInitialChapter(chapters).id, 'b');
  assert.equal(progress.getDisplayedProgress(140, chapters), 100);
  assert.equal(progress.getDisplayedProgress(undefined, [{ id: 'x', title: 'X', duration: '' }]), undefined);
  assert.equal(progress.getDisplayedProgress(undefined, chapters), 50);
  assert.equal(progress.isCourseCompleted(undefined, 100, []), true);
  assert.equal(progress.isCourseCompleted(false, 100, []), false);
  assert.equal(progress.getChapterCompleted({ id: 'c', title: '', duration: '', completed: true }, [optional]), true);
});

test('MAIR-608 completing a content recomputes its chapter and reports an already completed one', () => {
  const chapters = [{ id: 'a', title: 'A', duration: '', active: true, contents: [video, optional] }];
  const done = progress.completeContent(chapters, 'a', 'v');
  assert.equal(done.chapter.completed, true);
  assert.equal(done.chapter.active, false);
  assert.equal(done.wasAlreadyCompleted, false);
  assert.equal(progress.completeContent(done.chapters, 'a', 'v').wasAlreadyCompleted, true);
  assert.equal(progress.completeContent(chapters, 'missing', 'v').chapter, undefined);
  assert.notEqual(progress.chaptersStateKey(chapters), progress.chaptersStateKey(done.chapters));
});

test('MAIR-608 ratings average the distribution and add a clamped vote', () => {
  assert.equal(rating.getElearningRatingCount({ 5: 2, 4: -1 }), 2);
  assert.equal(rating.getElearningRatingAverage({}), undefined);
  assert.equal(rating.getElearningRatingAverage({ 5: 1, 4: 1 }), 4.5);
  assert.deepEqual(rating.incrementElearningRatingDistribution({ 5: 1 }, 9), { rating: 5, ratingCount: 2, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2 } });
  assert.equal(rating.formatElearningRating(4), '4');
  assert.equal(rating.formatElearningRating(4.25), '4.3');
  assert.equal(rating.formatElearningRating('Nouveau'), 'Nouveau');
  assert.equal(rating.getRatingLabel(0, '(aucune)'), '(aucune)');
  assert.equal(rating.getRatingLabel(1), '(1 note)');
  assert.equal(rating.getRatingLabel(3), '(3 notes)');
});

test('MAIR-608 author form values are trimmed and edited immutably', () => {
  const chapter = form.createEmptyCourseChapter();
  assert.equal(chapter.contents.length, 1);
  assert.equal(chapter.contents[0].required, true);
  const normalized = form.normalizeCourseFormValues({ title: ' T ', subtitle: ' ', description: ' D ', category: ' C ', statusValue: 'x', instructor: '', duration: ' 1 h ', deadline: '', requirement: 'none', level: 'none',
    chapters: [{ ...chapter, title: ' Ch ', duration: ' 5 ', contents: [{ ...chapter.contents[0], title: ' R ', fileName: ' ', href: ' https://x ' }] }] });
  assert.equal(normalized.title, 'T');
  assert.equal(normalized.chapters[0].title, 'Ch');
  assert.equal(normalized.chapters[0].contents[0].fileName, undefined);
  assert.equal(normalized.chapters[0].contents[0].href, 'https://x');
  const chapters = [chapter];
  assert.equal(form.patchChapter(chapters, chapter.id, { title: 'Nouveau' })[0].title, 'Nouveau');
  assert.equal(chapters[0].title, '');
  const contentId = chapter.contents[0].id;
  assert.equal(form.patchContent(chapters, chapter.id, contentId, { title: 'R' })[0].contents[0].title, 'R');
  assert.equal(form.patchContent(chapters, 'other', contentId, { title: 'R' })[0].contents[0].title, '');
  assert.deepEqual(form.removeContent(chapters, chapter.id, contentId)[0].contents, []);
  assert.deepEqual(form.removeChapter(chapters, chapter.id), []);
  assert.deepEqual(form.resourcePatch('link', 'u'), { href: 'u', fileName: undefined });
  assert.deepEqual(form.resourcePatch('pdf', 'f'), { fileName: 'f', href: undefined });
  for (const [value, label] of [['not-started', 'Non commencé (statut actuel)'], ['in-progress', 'En cours (statut actuel)'], ['completed', 'Terminé (statut actuel)'], ['custom', 'Statut actuel : custom'], [' ', 'Statut non renseigné']]) assert.equal(form.currentStatusLabel(value), label);
});

test('MAIR-608 catalogue rules infer status, badges and stats from courses', () => {
  const courses = [
    { id: 'a', title: 'RGPD', description: 'Données', category: 'Juridique', statusBadge: { label: 'Terminé' }, progress: 100, learners: '12', rating: 4, titleBadge: { label: 'Obligatoire' }, details: { title: 'RGPD', description: '', chapters: [{ id: 'c', title: '', duration: '', contents: [video, optional] }] } },
    { id: 'b', title: 'Accueil', description: 'Agents', instructor: 'DRH', statusBadge: { label: 'En cours' }, levelBadge: { variant: 'beginner' } },
  ];
  assert.equal(catalog.inferStatusValue(courses[0]), 'completed');
  assert.equal(catalog.inferStatusValue(courses[1]), 'in-progress');
  assert.equal(catalog.inferStatusValue({ id: 'c', title: '', description: '' }), 'not-started');
  assert.equal(catalog.getRequirement(courses[0]), 'mandatory');
  assert.equal(catalog.getRequirement({ titleBadge: { label: 'Recommandé' } }), 'recommended');
  assert.equal(catalog.getLevel(courses[1]), 'beginner');
  assert.deepEqual(catalog.getTitleBadge('recommended'), { label: 'Recommandé', variant: 'default' });
  assert.equal(catalog.getLevelBadge('none'), undefined);
  assert.deepEqual(catalog.getStatusBadge('unknown', { label: 'Perso', variant: 'default' }), { label: 'Perso', variant: 'default' });
  assert.deepEqual(catalog.buildCategories(courses).map(option => option.value), ['all', 'Juridique']);
  assert.deepEqual(catalog.buildDefaultStats(courses, 3).map(stat => stat.value), [2, '100%', '100%', 3]);
  assert.deepEqual(catalog.buildAdminStats(courses), { totalCourses: 2, totalLearners: 12, mandatoryCourses: 1, totalContents: 2, averageRating: 4, completionRate: 100 });
  assert.deepEqual(catalog.filterCourses(courses, 'drh', 'all', 'all').map(course => course.id), ['b']);
  assert.deepEqual(catalog.filterCourses(courses, '', 'Juridique', 'completed').map(course => course.id), ['a']);
});

test('MAIR-608 a course and its author form convert both ways', () => {
  const empty = catalog.getCourseFormValues();
  assert.equal(empty.statusValue, 'not-started');
  assert.equal(empty.chapters.length, 1);
  const values = { ...empty, title: 'Été 2026', description: 'D', requirement: 'mandatory', level: 'advanced', statusValue: 'in-progress' };
  const created = catalog.buildCourseFromFormValues(values);
  assert.match(created.id, /^ete-2026-/);
  assert.deepEqual(created.titleBadge, { label: 'Obligatoire', variant: 'mandatory' });
  assert.equal(created.statusBadge.label, 'En cours');
  assert.equal(created.details.completionRating.title, 'Noter cette formation');
  const back = catalog.getCourseFormValues(created);
  assert.deepEqual([back.title, back.requirement, back.level, back.statusValue], ['Été 2026', 'mandatory', 'advanced', 'in-progress']);
  assert.equal(catalog.getCourseDetails({ id: 'x', title: 'X', description: 'Y' }).chapters.length, 0);
});

test('MAIR-608 save and learner results only continue once confirmed', async () => {
  let closed = 0; const close = () => { closed += 1; };
  assert.equal(catalog.closeWhenSaved(false, close), false); assert.equal(closed, 0);
  catalog.closeWhenSaved(undefined, close); assert.equal(closed, 1);
  assert.equal(await catalog.closeWhenSaved(Promise.resolve(false), close), false); assert.equal(closed, 1);
  await catalog.closeWhenSaved(Promise.resolve(true), close); assert.equal(closed, 2);
  assert.equal(catalog.afterLearnerAction(false, () => 'next'), false);
  assert.equal(catalog.afterLearnerAction(undefined, () => 'next'), 'next');
  assert.equal(await catalog.afterLearnerAction(Promise.resolve(true), () => 'next'), 'next');
});
