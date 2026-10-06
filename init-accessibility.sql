-- Accessibility (RGAA) stack only (docker-compose-accessibility.yml, seeder-a11y), run after
-- init-test.sql (user 2, role User): the extra users of rgaa.yaml. Ids 3 to 5 are not used by
-- init-test.sql. Every user needs a user_roles row (core-api answers 502 on GET /user/me without
-- one); the BFFs read the role from the database, never from the JWT.
--
-- No course is seeded: bff-elearning 0.4.0 serves its own catalogue (three courses, kept in memory
-- per user id), so a state that writes (progress, rating) changes only the catalogue of its user.
-- Each writing state of rgaa.yaml therefore has its own user: states run in parallel and must not
-- see each other's writes.

INSERT INTO users (id, first_name, last_name, email, password, status)
VALUES
  -- admin: the catalogue with the administration controls ("Nouvelle formation", edit, delete).
  (3, 'Rgaa', 'Admin', 'rgaa-admin@mairie360.fr', 'dummy', 'active'),
  -- progress: only for the course-content-completed state.
  (4, 'Rgaa', 'Progress', 'rgaa-progress@mairie360.fr', 'dummy', 'active'),
  -- rater: only for the course-rated state.
  (5, 'Rgaa', 'Rater', 'rgaa-rater@mairie360.fr', 'dummy', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 3, r.id FROM roles r WHERE r.name = 'Admin'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM roles r CROSS JOIN (VALUES (4), (5)) AS u(id) WHERE r.name = 'User'
ON CONFLICT DO NOTHING;
