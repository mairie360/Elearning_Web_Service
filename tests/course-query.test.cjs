const assert = require('node:assert/strict');
const { test } = require('node:test');
require('./support/load-typescript.cjs');

const { courseIdFromSearch, urlWithoutCourse } = require('../src/lib/course-query.ts');

test('reads a URL-encoded course ID without losing Unicode', () => {
  assert.equal(courseIdFromSearch('?view=all&course=s%C3%A9curit%C3%A9%20incendie'), 'sécurité incendie');
  assert.equal(courseIdFromSearch('?view=all'), null);
  assert.equal(courseIdFromSearch('?course='), '');
});

test('removes only the course parameter while preserving other query and hash state', () => {
  assert.equal(
    urlWithoutCourse('https://training.example/catalog?view=all&course=s%C3%A9curit%C3%A9&sort=recent#top'),
    'https://training.example/catalog?view=all&sort=recent#top',
  );
  assert.equal(urlWithoutCourse('https://training.example/catalog?view=all'), null);
});
