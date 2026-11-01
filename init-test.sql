-- Seed minimal pour les tests isolés (performance / sécurité) du front Elearning.
-- L'utilisateur 2 est celui référencé par les JWT de test (claim sub = "2") :
--   * load-test.js le signe dynamiquement et l'envoie en cookie accessToken,
--   * docker-compose-security.yml injecte un cookie statique via le replacer ZAP.
INSERT INTO users (id, first_name, last_name, email, password, status)
VALUES (2, 'Perf', 'Tester', 'perf-tester@mairie360.fr', '$argon2id$v=19$m=19456,t=2,p=1$/iKF9PbiDRDs4EKPjlIIhg$UKx9vfwwps250mEP/bYp63CXbEnQGULeUAhDq+az9Aw', 'active')
ON CONFLICT (id) DO NOTHING;
-- Core API >= 1.1.1 exige au moins un rôle sur l'utilisateur pour GET /user/me
-- (sinon 502 côté BFF User, que BFF_Elearning appelle pour résoudre la session des routes /elearning/*).
INSERT INTO user_roles (user_id, role_id)
SELECT 2, r.id FROM roles r WHERE lower(r.name) = 'user'
ON CONFLICT DO NOTHING;
-- One course (a chapter holding a PDF content) the user is enrolled in, so the catalogue of the
-- isolated stack is not empty: the k6 `writes` scenario starts the course and completes its content,
-- and the ZAP spider reaches the course routes (MAIR-516). Explicit ids keep load-test.js simple.
INSERT INTO courses (id, title, description, category, level)
VALUES (1, 'Isolated stack onboarding', 'Course seeded for the performance and security stacks', 'onboarding', 'beginner')
ON CONFLICT (id) DO NOTHING;
INSERT INTO course_modules (id, course_id, title, content, sort_order)
VALUES (1, 1, 'Welcome', 'Single chapter of the seeded course', 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO course_attachments (id, module_id, file_name, file_type, file_url, file_size_bytes, title, sort_order)
VALUES (1, 1, 'welcome.pdf', 'pdf', 'courses/1/welcome.pdf', 1024, 'Welcome guide', 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO user_courses (user_id, course_id, status)
VALUES (2, 1, 'not_started')
ON CONFLICT DO NOTHING;
