const assert = require('node:assert/strict');
const { test } = require('node:test');
require('./support/load-typescript.cjs');

// MAIR-608: the rules pulled out of the e-learning components while splitting them.
const progress = require('../src/components/ElearningModule/components/ElearningCatalog/course-progress.ts');
const rating = require('../src/components/ElearningModule/components/ElearningCatalog/course-rating.ts');
const form = require('../src/components/ElearningModule/components/ElearningCatalog/components/ElearningCourseFormModal/course-form-values.ts');
const catalog = require('../src/components/ElearningModule/components/ElearningCatalog/catalog-model.ts');

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
  assert.deepEqual(catalog.buildLearnerMetrics(courses, 2026), { inProgress: 1, mandatoryToFinish: 0, nextDeadline: undefined, completed: 1, completedInYear: 0, year: 2026, available: 2 });
  // MAIR-1144: « Terminées en 2026 » counts the completion dates of the year only.
  assert.equal(catalog.buildLearnerMetrics([{ ...courses[0], completedAt: '2026-03-01T10:00:00Z' }, { ...courses[0], id: 'old', completedAt: '2025-12-01' }], 2026).completedInYear, 1);
  assert.deepEqual(catalog.filterCourses(courses, 'drh', 'all', 'all').map(course => course.id), ['b']);
  assert.deepEqual(catalog.filterCourses(courses, '', 'Juridique', 'completed').map(course => course.id), ['a']);
  // MAIR-1150: « Origine » of the administrator (a course without source is internal).
  assert.deepEqual(catalog.filterCourses([...courses, { id: 'p', title: 'Outil', description: '', source: 'platform' }], '', 'all', 'all', 'all', 'platform').map(course => course.id), ['p']);
  assert.deepEqual(catalog.filterCourses([...courses, { id: 'p', title: 'Outil', description: '', source: 'platform' }], '', 'all', 'all', 'all', 'internal').map(course => course.id), ['a', 'b']);
  assert.equal(catalog.getRequirement({ mandatory: true }), 'mandatory');
  assert.equal(catalog.getLevel({ level: 'advanced' }), 'advanced');
  // MAIR-1145: « À terminer » gathers not started and in progress; « Caractère » reads the mandatory badge.
  assert.deepEqual(catalog.filterCourses(courses, '', 'all', 'to-finish').map(course => course.id), ['b']);
  assert.deepEqual(catalog.filterCourses(courses, '', 'all', 'all', 'mandatory').map(course => course.id), ['a']);
  assert.deepEqual(catalog.filterCourses(courses, '', 'all', 'all', 'optional').map(course => course.id), ['b']);
  assert.equal(catalog.resultCountLabel(2, false), '2 formations');
  assert.equal(catalog.resultCountLabel(1, true), '1 formation correspond à votre recherche');
  assert.equal(catalog.resultCountLabel(3, true), '3 formations correspondent à votre recherche');
});

test('MAIR-1144 / MAIR-1146 deadlines are read, sorted and flagged when close', () => {
  assert.equal(catalog.deadlineTime('30 juin 2026'), Date.UTC(2026, 5, 30));
  assert.equal(catalog.deadlineTime('1er févr. 2027'), Date.UTC(2027, 1, 1));
  assert.equal(catalog.deadlineTime('2026-12-01'), Date.UTC(2026, 11, 1));
  assert.equal(catalog.deadlineTime('bientôt'), undefined);
  assert.equal(catalog.deadlineTime(undefined), undefined);
  const now = Date.UTC(2026, 5, 20);
  assert.equal(catalog.isDeadlineSoon('30 juin 2026', now), true);
  assert.equal(catalog.isDeadlineSoon('30 août 2026', now), false);
  assert.equal(catalog.isDeadlineSoon(undefined, now), false);
  const mandatory = { titleBadge: { label: 'Obligatoire', variant: 'mandatory' }, description: '' };
  const courses = [
    { ...mandatory, id: 'late', title: 'B', deadline: '30 août 2026' },
    { ...mandatory, id: 'soon', title: 'A', deadline: '30 juin 2026' },
    { ...mandatory, id: 'none', title: 'C' },
  ];
  assert.deepEqual(catalog.filterCourses(courses, '', 'all', 'to-finish', 'mandatory').map(course => course.id), ['soon', 'late', 'none']);
  assert.equal(catalog.buildLearnerMetrics(courses).nextDeadline, '30 juin 2026');
  assert.deepEqual(catalog.statusDisplay('completed'), { label: 'Terminée', tone: 'success' });
  assert.deepEqual(catalog.statusDisplay('in-progress'), { label: 'En cours', tone: 'warning' });
  assert.deepEqual(catalog.statusDisplay('not-started'), { label: 'Non commencée', tone: 'info' });
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

test('MAIR-703 only https addresses and paths of this site become links', () => {
  const { safeContentLink } = require('../src/components/ElearningModule/components/ElearningCatalog/safe-link.ts');
  assert.deepEqual(safeContentLink('https://www.cnil.fr/guide'), { href: 'https://www.cnil.fr/guide', host: 'www.cnil.fr' });
  assert.deepEqual(safeContentLink(' /documents/support.pdf '), { href: '/documents/support.pdf' });
  // Browsers drop tabs and line breaks from URLs: these would leave the site while looking local.
  for (const hidden of ['/\n/evil.test/x', '/\t/evil.test/x', '/\r/evil.test/x']) assert.equal(safeContentLink(hidden), undefined, JSON.stringify(hidden));
  for (const unsafe of ['javascript:alert(1)', 'data:text/html,x', 'http://example.test/', '//evil.test/x', '/\\evil.test', 'ftp://x.test/f', '', undefined]) {
    assert.equal(safeContentLink(unsafe), undefined, String(unsafe));
  }
});

test('MAIR-1143 the top card resumes the most advanced course in progress, else the nearest mandatory one', () => {
  const chapters = [{ id: 'a', title: 'A', duration: '', completed: true }, { id: 'b', title: 'B', duration: '' }];
  const mandatory = { titleBadge: { label: 'Obligatoire', variant: 'mandatory' } };
  const courses = [
    { id: '1', title: 'Peu avancée', description: '', statusValue: 'in-progress', progress: 10 },
    { id: '2', title: 'Avancée', description: '', statusValue: 'in-progress', progress: 60, details: { title: 'Avancée', description: '', chapters } },
    { ...mandatory, id: '3', title: 'Obligatoire', description: '', deadline: '30 juin 2026' },
  ];
  const resume = catalog.resumeSuggestion(courses);
  assert.deepEqual([resume.course.id, resume.kind, resume.chapterIndex, resume.chapterCount, resume.chapterTitle, resume.completedChapters, resume.progress], ['2', 'resume', 2, 2, 'B', 1, 60]);
  const priority = catalog.resumeSuggestion([courses[2], { ...mandatory, id: '4', title: 'Plus tard', description: '', deadline: '30 août 2026' }]);
  assert.deepEqual([priority.course.id, priority.kind, priority.chapterCount], ['3', 'priority', 0]);
  assert.equal(catalog.resumeSuggestion([{ id: '5', title: 'Facultative', description: '' }]), undefined);
  // A chapter without a completion flag whose required contents are done counts as done, as on the course screen.
  const inferred = catalog.resumeSuggestion([{ id: '6', title: 'Inférée', description: '', statusValue: 'in-progress', progress: 50, details: { title: 'Inférée', description: '', chapters: [
    { id: 'a', title: 'A', duration: '', contents: [{ id: 'a1', title: 'A1', type: 'video', completed: true }] },
    { id: 'b', title: 'B', duration: '', contents: [{ id: 'b1', title: 'B1', type: 'quiz' }] },
  ] } }]);
  assert.deepEqual([inferred.chapterIndex, inferred.chapterTitle, inferred.completedChapters], [2, 'B', 1]);
});

test('MAIR-932 / MAIR-703 the course form is checked before it is sent', () => {
  const values = form.normalizeCourseFormValues({
    title: '', subtitle: '', description: ' ', category: '', statusValue: 'not-started', instructor: '', duration: '', deadline: '',
    requirement: 'none', level: 'none', chapters: [{ id: 'c', title: 'C', duration: '', contents: [
      { id: 'ok', title: 'Guide', type: 'link', href: 'https://www.cnil.fr' },
      { id: 'local', title: 'Local', type: 'link', href: '/documents/a.pdf' },
      { id: 'js', title: 'Script', type: 'link', href: 'javascript:alert(1)' },
      { id: 'http', title: 'Clair', type: 'link', href: 'http://example.test' },
      { id: 'file', title: 'Fichier', type: 'pdf', fileName: 'javascript:x.pdf' },
    ] }],
  });
  const errors = form.validateCourseForm(values);
  assert.ok(errors.title && errors.description && errors.duration);
  // MAIR-703: the E-learning API stores absolute https:// links only (a path of the site is refused too).
  assert.deepEqual(Object.keys(errors.links), ['local', 'js', 'http']);
  assert.equal(form.hasCourseFormErrors(errors), true);
  assert.equal(form.firstErrorFieldId(errors), 'elearning-course-title');
  assert.equal(form.firstErrorFieldId({ links: { js: 'x' } }), 'content-resource-js');
  assert.equal(form.hasCourseFormErrors({ links: {} }), false);
  assert.equal(form.firstErrorFieldId({ links: {} }), undefined);
});

test('MAIR-1143 / MAIR-1144 dates, durations and the course to resume', () => {
  assert.equal(catalog.frenchDate('2026-06-30'), '30 juin 2026');
  assert.equal(catalog.frenchDate('30 juin 2026'), '30 juin 2026');
  assert.equal(catalog.frenchDate(''), undefined);
  assert.equal(catalog.formatDurationSeconds(8100), '2 h 15');
  assert.equal(catalog.formatDurationSeconds(7200), '2 h');
  assert.equal(catalog.formatDurationSeconds(2700), '45 min');
  assert.equal(catalog.yearOf('2026-01-01'), 2026);
  assert.equal(catalog.yearOf(undefined), undefined);
  const now = new Date('2026-11-23T12:00:00Z');
  assert.equal(catalog.lastActivityLabel('2026-11-22T12:00:00Z', now), 'hier');
  assert.equal(catalog.lastActivityLabel('2026-11-20T12:00:00Z', now), 'il y a 3 jours');
  assert.equal(catalog.lastActivityLabel('2026-10-01T12:00:00Z', now), 'le 1 octobre 2026');
  assert.match(catalog.lastActivityLabel('2026-11-23T09:00:00Z', now), /il y a 3 heures|aujourd’hui/);
  assert.equal(catalog.lastActivityLabel('not a date', now), undefined);
  const inProgress = (id, progress, lastActivityAt) => ({ id, title: id, description: '', statusValue: 'in-progress', progress, lastActivityAt });
  // The course touched last comes first, whatever its progress; without dates the most advanced one.
  const touched = catalog.resumeSuggestion([inProgress('a', 80, '2026-11-01T10:00:00Z'), inProgress('b', 10, '2026-11-22T10:00:00Z')], now);
  assert.equal(touched.course.id, 'b');
  assert.equal(touched.lastActivity, 'hier');
  assert.equal(catalog.resumeSuggestion([inProgress('a', 80), inProgress('b', 10)], now).course.id, 'a');
  const priority = catalog.resumeSuggestion([
    { id: 'late', title: 'L', description: '', statusValue: 'not-started', mandatory: true, deadline: '2026-12-31' },
    { id: 'soon', title: 'S', description: '', statusValue: 'not-started', mandatory: true, deadline: '2026-12-01' },
  ], now);
  assert.equal(priority.course.id, 'soon');
  assert.equal(priority.kind, 'priority');
  assert.equal(priority.lastActivity, undefined);
});

test('MAIR-932 a 400 of the BFF is placed under the fields of the form', () => {
  const values = {
    title: 'T', subtitle: '', description: 'D', category: '', statusValue: 'not-started', instructor: '', duration: '1 h', deadline: 'demain',
    requirement: 'none', level: 'none', chapters: [{ id: '11', title: '', duration: '', contents: [
      { id: '27', title: 'Vidéo', type: 'video' },
      { id: 'content-new', title: 'Lien', type: 'link', href: '/local' },
    ] }],
  };
  const { errors, unplaced } = form.serverFormErrors([
    { path: 'body.title', message: 'Required.' },
    { path: 'body.deadline', message: 'Expected a date (YYYY-MM-DD).' },
    { path: 'body.details.chapters.0.title', message: 'Required.' },
    { path: 'body.details.chapters.0.contents.1.href', message: 'A link needs an absolute https:// URL.' },
    { path: 'body.details.chapters.0.contents.0.type', message: 'A new content can only be a link, a quiz or other: there is no upload.' },
    { path: 'body.details.chapters.0.contents.0.duration', message: 'Expected a duration such as 12 min or 1 h 30.' },
    { path: 'body.instructor', message: 'At most 255 characters.' },
    { path: 'body.details.chapters.5.contents.0.title', message: 'Required.' },
    { path: 'body.details.chapters', message: 'At most 100 chapters.' },
  ], values);
  assert.equal(errors.title, 'Ce champ est obligatoire.');
  assert.equal(errors.fields['elearning-course-deadline'], 'Saisissez une date, par exemple 30 juin 2026.');
  assert.equal(errors.fields['chapter-title-11'], 'Ce champ est obligatoire.');
  assert.equal(errors.links['content-new'], 'Saisissez une adresse sécurisée commençant par https://.');
  assert.match(errors.fields['content-type-27'], /lien, un quiz/);
  assert.equal(errors.fields['content-duration-27'], 'Saisissez une durée comme 12 min ou 1 h 30.');
  assert.equal(errors.fields['elearning-course-instructor'], '255 caractères au maximum.');
  assert.deepEqual(unplaced, ['Ce champ est obligatoire.', 'Valeur refusée par le service de formation.']);
  assert.equal(form.firstErrorFieldId(errors), 'elearning-course-title');
  assert.equal(form.firstErrorFieldId({ links: {}, fields: { 'chapter-title-11': 'x' } }), 'chapter-title-11');
  // A new resource is a link, a quiz or « Autre »; a stored row keeps every type.
  assert.deepEqual(form.contentTypeOptionsFor({ id: 'content-x', type: 'link' }).map(option => option.value), ['link', 'quiz', 'other']);
  assert.equal(form.contentTypeOptionsFor({ id: '27', type: 'video' }).length, 7);
  assert.equal(form.createEmptyCourseContent().type, 'link');
});
