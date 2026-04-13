# Learning Roadmap — Teacher Recruitment System

> **Goal**: Learn the entire tech stack by building this project from scratch.  
> **Starting point**: Zero JavaScript knowledge. Familiar with Python.  
> **Approach**: Build one feature at a time. Every file, every line — explained.  
> **Duration**: ~20–24 weeks (adjustable based on pace)

---

## Current Environment Status

| Tool | Status | Action Needed |
|------|--------|---------------|
| Git | ✅ v2.50.1 | Ready |
| Python | ✅ v3.9.6 | Ready (for ML microservice later) |
| Node.js | ❌ Not installed | Install via `nvm` |
| npm | ❌ Not installed | Comes with Node.js |
| PostgreSQL | ❌ Not installed | Install via Homebrew |
| Redis | ❌ Not installed | Install via Homebrew |
| VS Code | ✅ (assumed) | Install recommended extensions |

---

## Phase 0: Environment Setup & Git Foundations

**Duration**: 2–3 days  
**What you'll learn**: Terminal basics, package managers, version control

### Tasks

1. **Install Node.js via nvm** (Node Version Manager)
   - Why nvm? → Lets you switch Node versions per project. Production might use v18, new project might use v22.
   - Install nvm → install Node.js LTS → verify with `node -v` and `npm -v`

2. **Install PostgreSQL via Homebrew**
   - `brew install postgresql@16` → start the service → create a database
   - Why PostgreSQL? → Relational data (schools, candidates, pipelines) needs joins + transactions. MongoDB can't do this reliably.

3. **Install Redis via Homebrew**
   - `brew install redis` → start the service
   - Why Redis? → In-memory store for sessions, OTPs, rate limit counters, job queues. PostgreSQL is too slow for these.

4. **Initialize Git repo**
   - `git init` → create `.gitignore` → first commit
   - Learn: `git add`, `git commit`, `git log`, `git diff`, `git branch`, `git merge`
   - Set up branch strategy: `main` (production) → `develop` (staging) → `feature/*` (your work)

5. **Create GitHub repo**
   - Push local to remote → set up SSH keys
   - Learn: `git push`, `git pull`, `git remote`

6. **VS Code extensions**
   - ESLint, Prettier, GitLens, Prisma, Thunder Client (API testing)

### Milestone: You can run `node -v`, `psql --version`, `redis-cli ping`, and `git log` successfully.

---

## Phase 1: JavaScript Fundamentals (Learn By Doing)

**Duration**: 2 weeks  
**What you'll learn**: Core JavaScript — the language behind everything we'll build

> [!IMPORTANT]
> We won't learn JS from a textbook. We'll write small scripts that solve REAL problems from our project, and learn concepts as they come up.

### Week 1: Basics

| Day | Concept | Project-Connected Exercise |
|-----|---------|---------------------------|
| 1 | Variables, types, console.log | Write a script that stores school data (name, location, strength) and prints it |
| 2 | Functions, parameters, return | Write a function `isEligible(candidate, requirement)` that checks if a candidate meets a requirement |
| 3 | Objects, arrays, destructuring | Create an array of candidate objects, filter by subject, sort by experience |
| 4 | if/else, switch, ternary | Write the privacy filter logic: what fields to show based on role |
| 5 | Loops (for, forEach, map, filter, reduce) | Calculate match scores for 10 candidates against a requirement |
| 6 | String methods, template literals | Build the OTP message template, email templates |
| 7 | **Practice day** | Refactor all exercises, push to Git with proper commit messages |

### Week 2: Intermediate

| Day | Concept | Project-Connected Exercise |
|-----|---------|---------------------------| 
| 1 | Callbacks, setTimeout | Simulate OTP expiry — generate OTP, expire after 5 seconds |
| 2 | Promises | Simulate async DB call — `findCandidate()` that returns a Promise |
| 3 | async/await | Rewrite Day 2 with async/await — much cleaner |
| 4 | Error handling (try/catch) | Handle "candidate not found", "OTP expired", "invalid input" errors |
| 5 | Modules (import/export) | Split your code into files: `utils.js`, `validators.js`, `matchEngine.js` |
| 6 | JSON, file read/write (fs module) | Read a JSON file of candidates, process them, write results to a new file |
| 7 | **Mini project** | Build a CLI tool: input a requirement → read candidates from JSON → output ranked matches |

### Milestone: Your CLI matching tool works. You understand async/await, modules, and error handling. 5+ commits on Git.

---

## Phase 2: Node.js & Express — Your First API Server

**Duration**: 2.5 weeks  
**What you'll learn**: How the internet works, HTTP, REST APIs, Express.js

### Week 1: HTTP & Express Foundations

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | "Hello World" Express server | What is a server? What is HTTP? What are ports? Request/Response cycle. |
| 2 | `GET /api/health` endpoint | Routing, request object, response object, status codes (200, 404, 500) |
| 3 | `POST /api/schools/register` | Request body parsing, `express.json()`, validating input manually |
| 4 | `GET /api/candidates` with query params | Query strings, pagination (`?page=1&limit=20`), filtering |
| 5 | Error handling middleware | Express middleware concept, `next()`, centralized error handler |
| 6 | Request validation with Zod | Why validate? Schema-based validation, reusable schemas |
| 7 | **Project structure** | Organize: `src/routes/`, `src/controllers/`, `src/middleware/`, `src/validators/` |

### Week 2: Middleware Deep Dive

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | Logging middleware (morgan) | What is middleware? The middleware chain. Request lifecycle. |
| 2 | CORS middleware | What is CORS? Why browsers block cross-origin requests. |
| 3 | Rate limiter middleware | Redis-backed rate limiting. Sliding window algorithm. |
| 4 | Auth middleware (placeholder) | `req.user` concept, protecting routes, `401` vs `403` |
| 5 | Privacy filter middleware | Our business-critical filter. Role-based field stripping. |
| 6 | Environment variables (.env) | Why never hardcode secrets. `dotenv` package. `.env.example` file. |
| 7 | **Integration** | Wire all middleware together. Test with Thunder Client or Postman. |

### Days 15–18: API Testing

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | First test with Jest | What is testing? Unit test vs integration test. `describe`, `it`, `expect`. |
| 2 | Test our validators | Test `validateSchoolInput()`, `validateCandidate()`. Edge cases. |
| 3 | Test our controllers | Mock request/response objects. Test different roles. |
| 4 | **Git workflow** | Create a `feature/api-foundation` branch, make a proper PR, merge to `develop`. |

### Milestone: A working Express API with 10+ endpoints, middleware chain, input validation, error handling, and tests. Proper Git branch workflow.

---

## Phase 3: PostgreSQL & Prisma — The Database Layer

**Duration**: 2.5 weeks  
**What you'll learn**: Relational databases, SQL, ORM, migrations, data modeling

### Week 1: SQL & PostgreSQL

| Day | What We Learn | Exercise |
|-----|--------------|---------|
| 1 | What is a database? Tables, rows, columns | Create `users` table manually in psql |
| 2 | INSERT, SELECT, WHERE | Insert 10 schools, query by location, by board |
| 3 | UPDATE, DELETE, soft deletes | Update a school's details, implement soft delete with `deleted_at` |
| 4 | JOINs (INNER, LEFT) | Join `users` → `schools`, `users` → `candidates` |
| 5 | Indexes, EXPLAIN ANALYZE | Add indexes, measure query speed improvement |
| 6 | Constraints (UNIQUE, CHECK, FK) | Implement our critical constraints (single pipeline, unique email) |
| 7 | Transactions | Why transactions matter: push candidate (update pipeline + create thread atomically) |

### Week 2: Prisma ORM

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | Install Prisma, `prisma init` | What is an ORM? Why not write raw SQL? Schema file. |
| 2 | Define `User`, `School`, `Candidate` models | Prisma schema syntax, relations, enums |
| 3 | Define `Requirement`, `Shortlist`, `Pipeline` models | One-to-many, many-to-many relations, optional fields |
| 4 | Define `Thread`, `Message`, `LockIn`, `AuditLog` models | Complete schema matching our TDD |
| 5 | Migrations | `prisma migrate dev` — what are migrations? Why version-control schema changes? |
| 6 | Seed data | `prisma db seed` — populate DB with test data for development |
| 7 | CRUD operations | `prisma.school.create()`, `.findMany()`, `.update()`, `.delete()` |

### Days 15–18: Connect API to Database

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | Replace in-memory data with Prisma queries | Real database reads/writes from our Express endpoints |
| 2 | School registration → DB | Full flow: validate → check duplicates → insert → respond |
| 3 | Candidate registration → DB | Same flow + profile fields |
| 4 | Integration tests with test database | Test DB setup, cleanup between tests, CI-ready tests |

### Milestone: Full database schema deployed. API reads/writes to PostgreSQL via Prisma. Seed data works. Tests pass.

---

## Phase 4: Authentication & Security — Protecting the System

**Duration**: 3 weeks  
**What you'll learn**: Passwords, JWTs, OTP, cookies, security headers, device trust

### Week 1: Password & JWT Auth

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | Password hashing with bcrypt | Why never store plain passwords. Hashing vs encryption. Cost factor. |
| 2 | Login endpoint | Compare hashed passwords. What to return on success/failure. |
| 3 | JWT creation & verification | What is a JWT? Header, payload, signature. Why signed not encrypted. |
| 4 | httpOnly cookies | Why not localStorage (XSS). Cookie flags: Secure, SameSite, httpOnly. |
| 5 | Auth middleware (real) | Extract JWT from cookie → verify → attach `req.user` → protect routes |
| 6 | Refresh token rotation | Access token (short) + refresh token (long). Rotation logic. Revocation. |
| 7 | Forced password change | School first-login flow. `password_changed` flag. Redirect logic. |

### Week 2: OTP & 2FA

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | OTP generation & storage (Redis) | Random 6-digit number. TTL in Redis. Why not in DB. |
| 2 | OTP verification endpoint | 3-attempt limit. Expiry checking. Redis key deletion. |
| 3 | SMS integration (MSG91) | API integration. Environment variables for API keys. Error handling. |
| 4 | Email integration (SendGrid) | Email templates. Sending OTP by email. Verify both channels. |
| 5 | Complete registration flow | Form → validate → OTP → verify → create user → send credentials |
| 6 | Admin 2FA | Mandatory OTP on every admin login, not just registration |
| 7 | Account lockout | 5 failed attempts → lock for 15 min. Redis counter. |

### Week 3: Device Trust & Security Headers

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | Device fingerprinting | Browser + OS + timezone hash. `trusted_devices` table. |
| 2 | "Was this you?" email flow | Instagram-style login detection. Email on unknown device. |
| 3 | "Secure my account" flow | Revoke all sessions, force password reset. |
| 4 | CSRF protection | Double-submit cookie pattern. `X-CSRF-Token` header. |
| 5 | Security headers (Helmet.js) | X-Frame-Options, Content-Type-Options, HSTS, CSP |
| 6 | Role-based access control | Role guard middleware. ADMIN, SCHOOL, CANDIDATE permissions. |
| 7 | **Auth integration tests** | Test all auth flows: register, login, refresh, logout, lockout |

### Milestone: Complete auth system with OTP, JWT, refresh rotation, device trust, security headers. Login from a new device triggers email alert.

---

## Phase 5: Core Business Logic — Matching, Shortlisting, Pipeline

**Duration**: 3 weeks  
**What you'll learn**: Complex business rules, state machines, database transactions, atomic operations

### Week 1: School Registration Fee & Requirements

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | Free tier counter (Redis INCR) | Atomic counters. Race condition prevention. ≤200 = free. |
| 2 | Razorpay integration | Payment gateway basics. Order creation. Checkout flow. |
| 3 | Payment verification + webhook | Signature verification. Idempotency. Webhook security. |
| 4 | Create requirement endpoint | School posts a teaching requirement. Validation. |
| 5 | List/edit/delete requirements | CRUD with business rules (can't edit if shortlists exist). |
| 6 | Payment reconciliation job | Introduction to background jobs. Bull queue basics. |
| 7 | Tests + Git PR | Test payment flows (mock Razorpay). Merge feature. |

### Week 2: AI Matching Engine (Python Microservice)

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | FastAPI setup (Python) | Why a separate service? HTTP API between services. |
| 2 | Heuristic matching algorithm | Score candidates: subject match, experience, location, qualification. |
| 3 | Weight configuration | Configurable weights for each matching criterion. |
| 4 | Match score API | `POST /match` — takes requirement, returns ranked candidates with scores. |
| 5 | Connect Node.js → Python | HTTP call from Express to FastAPI. Error handling. Timeout. |
| 6 | Match results endpoint | `GET /schools/matches/:reqId` → calls ML service → returns filtered results |
| 7 | Semi-supervised learning hooks | Store feedback data. Placeholder for model training pipeline. |

### Week 3: Shortlisting & Pipeline Management

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | Shortlist creation | School shortlists candidates. Status: PENDING. Admin notification. |
| 2 | Admin approve/reject shortlist | Admin reviews. Adds notes. Status transition. |
| 3 | Push to pipeline (admin) | Single-pipeline constraint. Database transaction. Thread creation. |
| 4 | Pipeline state machine | ACTIVE → RELEASED / SELECTED / TIMEOUT. State transition rules. |
| 5 | Manual release | Admin/school releases candidate. Thread closed. Candidate back in pool. |
| 6 | 7-day auto-release cron | Bull recurring job. Find stale pipelines. Auto-release + notify. |
| 7 | Day 3 & Day 5 warnings | Warning notifications. SMS + email + in-app. |

### Milestone: Complete pipeline from requirement → match → shortlist → push → communicate → select/release. Auto-release works.

---

## Phase 6: Real-Time Chat & Messaging

**Duration**: 2 weeks  
**What you'll learn**: WebSockets, real-time communication, Socket.io, file uploads, content moderation

### Week 1: Socket.io Chat

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | Socket.io server setup | HTTP vs WebSocket. Persistent connections. Events. |
| 2 | JWT auth on WebSocket handshake | Authenticate socket connections. Reject invalid tokens. |
| 3 | Room-based messaging | Join `thread:{id}` rooms. Broadcast to room members only. |
| 4 | Message persistence | Save to DB → broadcast. Offline users see messages on load. |
| 5 | Read receipts & typing indicators | `message:read` event. `typing:start` / `typing:stop`. |
| 6 | Message templates | Pre-built templates for common communications. |
| 7 | Admin read-only access | Admin joins any room. Read-only flag. Cannot send. |

### Week 2: Files, Moderation & Contact Leak Detection

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | File upload to S3 | Multer for upload. S3 SDK. Pre-signed URLs. |
| 2 | MIME validation & virus scan | Magic byte check. ClamAV integration. |
| 3 | EXIF stripping | Remove GPS metadata from images. Privacy protection. |
| 4 | Contact leak detection | Implement the 14 regex patterns. Flag messages for admin. |
| 5 | Admin moderation dashboard | View flagged messages. Take action. Audit log. |
| 6 | Thread lifecycle | Auto-close on release/selection. Prevent messaging in closed threads. |
| 7 | **Chat integration tests** | Test send/receive, file upload, flag detection, thread closing. |

### Milestone: Real-time chat works. Files can be shared. Contact info attempts are auto-flagged. Admin can moderate.

---

## Phase 7: Frontend — React & Next.js

**Duration**: 4 weeks  
**What you'll learn**: React fundamentals, components, state, hooks, Next.js, SSR, Tailwind CSS

### Week 1: React Fundamentals

| Day | Concept | What We Build |
|-----|---------|--------------|
| 1 | JSX, components, props | Static "School Card" component showing school info |
| 2 | State (`useState`) | Registration form with controlled inputs |
| 3 | Effects (`useEffect`) | Fetch candidates from our API on page load |
| 4 | Event handling | Form submission, button clicks, input validation |
| 5 | Conditional rendering | Show/hide elements based on role (school vs candidate) |
| 6 | Lists & keys | Render a list of matched candidates |
| 7 | Component composition | Break down a page into Header, Sidebar, MainContent, Card components |

### Week 2: Next.js Setup & Pages

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | Next.js project setup | File-based routing. Pages vs App router. Project structure. |
| 2 | Landing page | SSR for SEO. Meta tags. Responsive design basics. |
| 3 | Login page | Form → API call → set cookie → redirect. Error display. |
| 4 | Registration page (school) | Multi-step form. OTP input. Payment redirect. |
| 5 | Registration page (candidate) | Profile form with file upload (resume). |
| 6 | Layout components | Shared sidebar, header, footer. Role-based layouts. |
| 7 | Protected routes | Auth check on page load. Redirect if not logged in. |

### Week 3: Dashboard & Core Pages

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | School dashboard | Stats cards, active pipelines, recent activity. |
| 2 | Post requirement form | Dynamic form. Subject selection. Validation. |
| 3 | Match results page | Candidate cards (privacy-filtered). Match score display. |
| 4 | Shortlist management | Select candidates, submit shortlist request. Status tracking. |
| 5 | Candidate dashboard | Match score trends (chart.js). Push history. Profile views. |
| 6 | Admin dashboard | Pending approvals. Flagged messages. System stats. |
| 7 | Admin actions | Approve/reject shortlists. Push candidates. Dismiss users. |

### Week 4: Chat UI & Video Calls

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | Chat interface | Thread list + message view. Real-time with Socket.io client. |
| 2 | Message input & file sharing | Text input, emoji, file attachment UI. |
| 3 | Typing indicators & read receipts | Real-time UI updates. |
| 4 | Video call UI (WebRTC) | Camera/mic access. Peer connection. Call controls. |
| 5 | Recording controls | Host-controlled recording. Permission toggle. Indicator. |
| 6 | Interview scheduling UI | Calendar picker. Mode selection. Invite flow. |
| 7 | Responsive design pass | Mobile-friendly layouts. Tailwind breakpoints. |

### Milestone: Full working frontend. All user flows functional. Real-time chat and video calls work.

---

## Phase 8: Notifications, Email Relay & Lock-in

**Duration**: 1.5 weeks  
**What you'll learn**: Notification systems, email templating, scheduled jobs, account lifecycle

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | In-app notification system | Notification model. Real-time delivery via Socket.io. |
| 2 | Notification preferences | User settings: email, SMS, in-app toggles. |
| 3 | Email notification templates | HTML email templates. SendGrid dynamic templates. |
| 4 | SMS notifications | MSG91 templates. OTP, warnings, confirmations. |
| 5 | Interview invite email relay | Send "from" school's email. SPF/DKIM considerations. |
| 6 | Post-placement feedback | Rating form. Admin-only visibility. Stored in `feedbacks` table. |
| 7 | Lock-in implementation | Candidate deactivation. 1-year expiry. Auto-reactivation cron. |
| 8 | Unlock appeal flow | Email support → admin review → manual unlock. Audit logged. |
| 9 | Daily digest email | Cron at 8 AM IST. Unread notification summary. |
| 10 | **Integration testing** | Test all notification channels. Lock-in lifecycle test. |

### Milestone: Notifications work across all channels. Lock-in lifecycle works. Email relay works.

---

## Phase 9: Monitoring, Logging & Production Readiness

**Duration**: 1.5 weeks  
**What you'll learn**: Structured logging, health checks, error tracking, performance optimization

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | Structured logging (Winston) | Log levels. JSON format. PII masking. Request IDs. |
| 2 | Health endpoints | `/health`, `/health/ready`. Check all dependencies. |
| 3 | Audit logging | Every mutation logged. Old/new values. IP address. |
| 4 | Error tracking | Global error handler. Categorized error codes from TDD. |
| 5 | API response time tracking | Middleware to measure duration. Log slow queries. |
| 6 | Database query optimization | EXPLAIN ANALYZE. Identify slow queries. Index tuning. |
| 7 | Frontend performance | Lighthouse audit. Bundle analysis. Lazy loading. |
| 8 | Caching implementation | Redis caching for hot queries. Cache invalidation. |
| 9 | Content Security Policy | CSP headers. Test with browser dev tools. |
| 10 | **Load testing** | Basic load tests with `autocannon`. Find bottlenecks. |

### Milestone: Production-grade logging, monitoring, and error handling. Performance within budget.

---

## Phase 10: CI/CD Pipeline & Deployment

**Duration**: 1.5 weeks  
**What you'll learn**: GitHub Actions, automated testing, deployment, Docker basics

| Day | What We Build | Concepts Learned |
|-----|--------------|-----------------|
| 1 | `.github/workflows/ci.yml` | What is CI? GitHub Actions basics. YAML syntax. |
| 2 | Lint + type check in CI | ESLint config. TypeScript strict mode. Auto-run on PR. |
| 3 | Unit tests in CI | Jest in CI. Test database setup. Coverage reports. |
| 4 | Integration tests in CI | Docker Compose for test DB + Redis. Full API test suite. |
| 5 | Security audit in CI | `npm audit`. Dependabot alerts. Fail on critical vulnerabilities. |
| 6 | Build check in CI | Next.js production build. Catch build errors before merge. |
| 7 | Docker basics | Dockerfile for API. Docker Compose for local dev. |
| 8 | Deploy to staging | Vercel for frontend. Railway/Render for backend. |
| 9 | Production deployment | Environment variables. Database migration. DNS setup. |
| 10 | Post-deploy verification | Smoke tests. Health check. Monitor for errors. |

### Milestone: Full CI/CD pipeline. Push code → auto-test → auto-deploy. Production is live.

---

## Weekly Timeline Summary

```
Week 0      ┃ Phase 0: Environment Setup + Git
Weeks 1-2   ┃ Phase 1: JavaScript Fundamentals
Weeks 3-5   ┃ Phase 2: Node.js + Express API
Weeks 5-7   ┃ Phase 3: PostgreSQL + Prisma
Weeks 8-10  ┃ Phase 4: Authentication + Security
Weeks 11-13 ┃ Phase 5: Core Business Logic (Matching, Pipeline)
Weeks 14-15 ┃ Phase 6: Real-Time Chat + Messaging
Weeks 16-19 ┃ Phase 7: Frontend (React + Next.js)
Weeks 20-21 ┃ Phase 8: Notifications + Email + Lock-in
Week 22     ┃ Phase 9: Monitoring + Production Readiness
Week 23-24  ┃ Phase 10: CI/CD + Deployment
```

---

## Git Workflow You'll Follow

```
main (production-ready code)
  │
  └── develop (integration branch)
        │
        ├── feature/phase-0-setup
        ├── feature/phase-1-js-fundamentals
        ├── feature/express-api-foundation
        ├── feature/database-schema
        ├── feature/auth-system
        ├── feature/matching-engine
        ├── feature/pipeline-management
        ├── feature/realtime-chat
        ├── feature/frontend-core
        ├── feature/notifications
        ├── feature/monitoring
        └── feature/cicd-pipeline
```

**Every feature:**
1. Create branch from `develop`
2. Write code + tests
3. Commit with meaningful messages
4. Push to GitHub
5. Create PR (even though you're solo — builds the habit)
6. Review your own code (checklist)
7. Merge to `develop`
8. When stable → merge `develop` to `main`

---

## How Our Sessions Will Work

Each session, we'll:

1. **Pick the next task** from the current phase
2. **I explain the concept** — WHY we need this, how it works
3. **We write the code together** — file by file, line by line
4. **I explain every decision** — why this library, why this pattern, why this structure
5. **You test it** — run the code, see it work, break it, fix it
6. **You commit and push** — with a proper commit message

> [!IMPORTANT]
> **You do the typing.** I guide. If you copy-paste without understanding, you learn nothing. I'll explain, you implement. If something doesn't make sense, stop and ask.

---

## Pre-requisites Before We Start Phase 0

Before our first coding session, you should:

1. ✅ Have a GitHub account
2. ✅ Have VS Code installed
3. ⬜ Install Homebrew (if not installed): `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
4. ⬜ Basic terminal comfort (cd, ls, mkdir, cat, echo)

---

## Ready to Start?

Once you approve this roadmap, we begin with **Phase 0: Environment Setup**:

1. Install nvm + Node.js
2. Install PostgreSQL
3. Install Redis
4. Initialize Git repo with proper `.gitignore`
5. Create GitHub repo
6. First commit: project README + documentation files

**Let me know if you want to adjust the timeline, reorder phases, or have any questions about the approach!**
