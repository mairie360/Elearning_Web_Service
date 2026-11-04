-- Accessibility (RGAA) stack only (docker-compose-accessibility.yml, seeder-a11y), run after
-- init-test.sql (user 2, role User, course 1 not started): the extra user of rgaa.yaml. Every user
-- needs a user_roles row (core-api answers 502 on GET /user/me without one); the BFFs read the role
-- from the database, never from the JWT. No password: the engine signs the JWT.

-- progress: only for the course-content-completed state (it writes a completion, and the states
-- run in parallel), enrolled in the course of init-test.sql.
INSERT INTO users (id, first_name, last_name, email, password, status)
VALUES (4, 'Rgaa', 'Progress', 'rgaa-progress@mairie360.fr', NULL, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 4, r.id FROM roles r WHERE r.name = 'User'
ON CONFLICT DO NOTHING;

INSERT INTO user_courses (user_id, course_id, status)
VALUES (4, 1, 'in_progress')
ON CONFLICT DO NOTHING;
