# Copilot Instructions — Student Tracker (CodeByAmrit/school)

Overview

- This repository is an Express (Node.js) app using EJS templates, Tailwind CSS, MySQL (mysql2/promise), and includes server-side PDF generation and an AI assistant integration.
- Key directories: `router/` (HTTP routes), `components/` (business logic), `models/` (DB pool and SQL), `services/` (auth, helpers), `views/` (EJS templates), `public/` (static assets).

Quick start (developer)

- Install: `npm install`
- Dev server: `npm run dev` (nodemon — runs `bin/www`; default port comes from `process.env.PORT` or 3000)
- Tailwind CSS watcher: `npm run build:css`
- Production with PM2: `npm run start:pm2` (uses `pm2` to run `bin/www`)
- Docker: `docker-compose up` (image `codebyamrit/student-tracker`), or build with `docker build -t <name> .`

Important notes / gotchas

- Environment variables: see `readme.md`; required vars include DB\_\* (host/user/password/database/port), `jwt_token` (used by `services/aouth.js`), `GEMINI_API_KEY` (AI), and email credentials.
- DB connection: use `const { getConnection } = require('../models/getConnection')` and always `release()` the connection when done. The project uses `mysql2/promise` and a connection pool (`models/getConnection.js`).
- Authentication: JWT stored in a cookie named `token`; middleware `services/checkauth.js` sets `req.user` via `getUser(token)`.
- Routes are organized in `router/` (main site in `route.js`, student APIs in `student.js`, AI in `ai_router.js`). Prefer adding API endpoints to `router/` and business logic to `components/`.

Patterns & conventions (do this)

- Use CommonJS (`require` / `module.exports`) consistently — avoid switching to ESM unless you update app entrypoints.
- For new database work: always use parameterized queries (`connection.execute(sql, [params])`) to prevent SQL injection.
- File uploads use `multer` with memory storage in `route.js` (`upload.fields` / `upload.single`). Images are processed with `sharp` in `components/student.js`.
- PDF generation is implemented under `components/` (`create_certificate.js`, `achievement.js`) using `pdf-lib`.
- When adding a new page, create an EJS template under `views/` and add a route in `router/route.js` that populates `res.render(...)` with `user` and `total_students` where appropriate.

AI & external integrations

- AI: `components/ai_controller.js` integrates with Google Generative AI (Gemini) via `@google/generative-ai`; env var: `GEMINI_API_KEY`.
- Email and recaptcha rely on env vars and third-party libraries (`nodemailer`).

Debugging & testing tips

- Run server with `NODE_ENV=development` (default) to get request logging via `morgan`.
- Database debugging: you can drop into a route and log SQL or run queries locally using `mysql2`/MySQL client.
- There are no automated tests in the repo — add unit/integration tests under `test/` if requested; prefer small, targeted tests for `components/` functions.

Code examples (typical route -> component -> DB pattern)

- Route (router/route.js)

```
router.get('/marks/:studentId/:term', checkAuth, async (req,res) => {
  const { studentId, term } = req.params;
  const marks = await getStudentMarks(studentId, term); // components/student.js
  res.json(marks);
});
```

- DB helper usage (models/getConnection.js)

```
const connection = await getConnection();
const [rows] = await connection.execute('SELECT ... WHERE id = ?', [id]);
connection.release();
```

Security & review points for PRs

- Verify no plaintext secrets in code (e.g., API keys). Move any such values to `.env` or GitHub Secrets.
- Confirm JWT `jwt_token` secret exists and is sufficiently strong.
- Ensure image processing (`sharp`) uses safe memory limits for large uploads.

Where to look for common tasks

- Add endpoint -> `router/` + `components/` + view in `views/` (if UI needed).
- Database schema -> `models/structure.sql` (useful to understand table shape and views).
- Docker/CI -> `Dockerfile`, `docker-compose.yaml`, `.github/workflows/docker-image.yml`.

If anything here is incomplete or you want more examples (e.g., sample endpoint + tests + docs), tell me which area to expand and I will iterate. Thanks!
