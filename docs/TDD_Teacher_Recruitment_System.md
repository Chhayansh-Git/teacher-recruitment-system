# Technical Design Document — Teacher Recruitment System

> Companion document to PRD v3.1 Final.  
> Covers system architecture decisions, security hardening, data integrity, edge-case handling, and operational readiness needed before development begins.  
> **Audience**: Development team, code reviewers, QA, and DevOps.

---

## Table of Contents

1. System Architecture & Infrastructure
2. Authentication & Identity
3. Authorization & Data Privacy Enforcement
4. Database Schema Design
5. API Design & Contracts
6. Security Hardening
7. Edge Cases & Business Logic Safety Nets
8. Real-Time Communication Engine
9. File Handling & Media Security
10. Background Jobs & Scheduled Tasks
11. Caching Strategy
12. Monitoring, Logging & Alerting
13. Deployment, CI/CD & Rollback
14. Legal Compliance & Data Governance
15. Performance Budgets
16. Error Handling & Error Code Catalog

---

## 1. System Architecture & Infrastructure

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLOUDFLARE (WAF + CDN)                         │
│               DDoS protection, SSL termination, Bot shield              │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
      ┌────────────┐   ┌────────────┐   ┌────────────────┐
      │  Next.js    │   │  Socket.io  │   │  TURN/STUN     │
      │  Frontend   │   │  Server     │   │  Server        │
      │  (Vercel)   │   │  (WebSocket)│   │  (WebRTC)      │
      └──────┬─────┘   └──────┬─────┘   └────────┬───────┘
             │                │                    │
             ▼                ▼                    │
      ┌──────────────────────────────────┐         │
      │       Core API Server            │◀────────┘
      │    (Node.js / Express)           │
      │    - REST endpoints              │
      │    - Auth middleware              │
      │    - Privacy filter layer         │
      │    - Webhook handlers             │
      └───────┬──────┬──────┬───────────┘
              │      │      │
     ┌────────┘      │      └────────┐
     ▼               ▼               ▼
┌─────────┐   ┌───────────┐   ┌───────────────┐
│PostgreSQL│   │   Redis    │   │ Python ML     │
│ (Primary │   │ (Cache +   │   │ Microservice  │
│  + Read  │   │  Queues +  │   │ (Matching +   │
│  Replica)│   │  Sessions) │   │  Profile Coach)│
└─────────┘   └───────────┘   └───────────────┘
                                      │
                               ┌──────┘
                               ▼
                        ┌──────────────┐
                        │  AWS S3      │
                        │  (Chat Files │
                        │  & Documents)│
                        └──────────────┘

External Services:
  - Razorpay (Payments)
  - MSG91 / Twilio (SMS + OTP)
  - SendGrid (Email + Interview Invite Relay)
```

### 1.2 Why This Architecture?

| Decision | Reason |
|----------|--------|
| **Cloudflare in front** | India-focused platform needs DDoS protection and edge caching without heavy infra investment. Free tier covers MVP. |
| **Next.js on Vercel** | SSR for SEO (school landing pages), fast deploys, edge functions for geolocation. Vercel's free tier suits early stage. |
| **Separate Socket.io server** | Chat and notifications are high-throughput, long-lived connections. Isolating them prevents a spike in messages from degrading REST API response times. |
| **Separate TURN server** | WebRTC video calls need a relay when peer-to-peer fails (strict NATs, firewalls — common in Indian school networks). A dedicated server prevents video traffic from impacting the main API. |
| **PostgreSQL + Read Replica** | Relational data (schools, candidates, requirements, pipelines) with complex joins. Read replica offloads dashboard/report queries from the write-primary. |
| **Redis (multi-purpose)** | Session store, rate-limit counters (sliding window), caching hot queries, Bull job queues. One service, four uses — reduces ops complexity for a small team. |
| **Python microservice for ML** | Scikit-learn / TensorFlow ecosystem is Python-native. HTTP API (FastAPI) keeps it language-agnostic from the Node.js core. |
| **AWS S3 for files** | Private bucket + pre-signed URLs = no direct access. Mumbai region (ap-south-1) satisfies data localization. Used for chat attachments and documents only — no video recordings stored server-side. |

### 1.3 Service Communication

| From → To | Protocol | Auth Mechanism |
|-----------|----------|----------------|
| Frontend → API | HTTPS (REST) | JWT in httpOnly cookie |
| Frontend → Socket.io | WSS | JWT in handshake auth |
| Frontend → TURN | STUN/TURN | Time-limited credentials from API |
| API → ML Service | HTTP (internal network) | Shared API key (env variable) |
| API → PostgreSQL | TCP/SSL | Connection string with cert |
| API → Redis | TCP/TLS | Password auth |
| API → S3 | HTTPS | IAM role (no keys in code) |
| API → Razorpay | HTTPS | API key + secret |
| API → MSG91 | HTTPS | Auth token |
| API → SendGrid | HTTPS | API key |
| Razorpay → API (webhook) | HTTPS | Razorpay signature verification |

---

## 2. Authentication & Identity

### 2.1 Registration & Login Flow

**Schools:**
1. Fill registration form → server validates inputs
2. Server sends OTP to phone (via MSG91) AND email (via SendGrid) simultaneously
3. User enters both OTPs → server verifies → marks user VERIFIED
4. Server auto-generates username + temporary password → emails it to school
5. School logs in with temporary credentials → system **immediately redirects to a mandatory password reset screen** (no dashboard access until password is changed)
6. School sets new password (must meet password policy) → system marks `password_changed = true`
7. JWT access token (15 min) + refresh token (7 days) issued
8. On every subsequent login, system checks `password_changed` flag — if `false`, redirect to reset screen again

**Candidates:**
1. Fill profile form → server validates inputs
2. OTP verification (same as above)
3. Candidate sets their own password during registration
4. JWT tokens issued on login

**Admin:**
1. Pre-seeded account (no self-registration)
2. Login via email + password + OTP (2FA mandatory)
3. Shorter token expiry (access: 10 min, refresh: 4 hours)

### 2.2 Token Architecture

| Token | Format | Expiry | Storage | Rotation |
|-------|--------|--------|---------|----------|
| Access | JWT (signed, not encrypted) | School/Candidate: 15 min, Admin: 10 min | httpOnly, Secure, SameSite=Strict cookie | On each refresh |
| Refresh | Opaque UUID | School/Candidate: 7 days, Admin: 4 hours | httpOnly cookie + hashed in DB | Single-use (rotated on each refresh) |
| OTP | 6-digit numeric | 5 minutes | Redis key with TTL | Invalidated after 3 failed attempts or successful use |

**JWT Payload (Access Token):**
```json
{
  "sub": "user_uuid",
  "role": "SCHOOL | CANDIDATE | ADMIN",
  "schoolId": "uuid (if school)",
  "candidateId": "uuid (if candidate)",
  "iat": 1713043200,
  "exp": 1713044100
}
```

**Rules:**
- Never store JWT in localStorage (XSS-vulnerable)
- Refresh token rotation: each refresh issues a NEW refresh token and invalidates the old one. If a stolen old token is used, ALL tokens for that user are revoked (family rotation).
- On logout: clear cookies + blacklist the refresh token in Redis (TTL = remaining expiry)

### 2.3 Password Policy

| Rule | Requirement |
|------|-------------|
| Minimum length | 8 characters |
| Complexity | At least 1 uppercase, 1 lowercase, 1 digit, 1 special character |
| History | Cannot reuse last 3 passwords |
| Hashing | bcrypt with cost factor 12 |
| First login | Auto-generated passwords force immediate change — dashboard is completely blocked until reset is complete |
| Brute force | Account locked for 15 min after 5 consecutive failed attempts |
| Reset | OTP-based (phone + email), never via URL token |

### 2.4 Device Trust & Suspicious Login Detection (Instagram-Style)

Every login attempt is checked against a **trusted devices** table. A device is identified by a fingerprint hash (browser + OS + screen resolution + timezone) stored as a cookie.

**How it works:**

```
Login Attempt
  │
  ├── Is device recognized (trusted)?
  │     ├── YES → Normal login flow
  │     └── NO (unregistered device) →
  │           │
  │           ├── Login FAILED?
  │           │     └── Send email IMMEDIATELY:
  │           │         "Someone tried to log in to your account"
  │           │         "Was this you?"
  │           │         → [Yes, it was me] — no action
  │           │         → [No, secure my account] → redirect to:
  │           │              - Change password
  │           │              - Enable 2FA (optional for schools/candidates)
  │           │
  │           └── Login SUCCEEDED?
  │                 └── Send email IMMEDIATELY:
  │                     "New login from [Device] in [Location]"
  │                     "Was this you?"
  │                     → [Yes, it was me] → device added to trusted list
  │                     → [No, secure my account] → revoke all sessions
  │                        + force password reset on next login
  │
  └── On subsequent failed logins from the SAME unregistered device:
        → No additional email (already sent on first attempt)
        → After 5 total failed attempts → account locked for 15 min
```

**Email content includes:**
- Device type (e.g., "Chrome on Windows")
- Approximate location (from IP geolocation — city level, not exact)
- Date and time of the attempt
- Two clear action buttons: "Yes, this was me" / "Secure my account"

**Trusted Devices Table:**
```
trusted_devices
  - id (PK)
  - user_id (FK)
  - device_fingerprint (hashed)
  - device_name ("Chrome on macOS")
  - last_used_at
  - ip_address
  - location_city
  - created_at
```

**Rules:**
- A device becomes "trusted" only when the user confirms via the "Yes, this was me" email link
- Users can view and remove trusted devices from their account settings
- Admin accounts: 2FA is mandatory regardless — device trust is an additional layer, not a replacement
- Trusted device cookie expires after 90 days of inactivity → device becomes unregistered again

### 2.5 Session Management

- One active session per device (configurable)
- Admin: max 1 active session (single-session enforcement)
- Session revocation: admin can force-logout any user via the admin panel
- Idle timeout: 30 minutes of inactivity → auto-logout (frontend + backend)
- Users can see all active sessions in account settings and revoke any session

---

## 3. Authorization & Data Privacy Enforcement

### 3.1 Role Hierarchy

```
SUPER_ADMIN  (future scope — for multi-admin setups)
    └── ADMIN
            ├── SCHOOL
            └── CANDIDATE
                    └── DEACTIVATED_CANDIDATE (locked-in, no access)
```

### 3.2 Middleware Architecture

Every request passes through this chain:

```
Request
  → Rate Limiter (Redis-backed)
  → CORS Check
  → CSRF Validation (state-changing requests)
  → JWT Verification (extract user from token)
  → Role Guard (does this role have access to this endpoint?)
  → Resource Ownership Check (does this user OWN this resource?)
  → Privacy Filter (strip forbidden fields from response based on role + pipeline stage)
  → Controller Logic
  → Response
```

### 3.3 Privacy Filter — The Most Critical Middleware

This is the layer that enforces the PRD's visibility matrix. It runs AFTER the controller generates a response but BEFORE it's sent to the client.

```javascript
// Pseudocode — Privacy Filter
function privacyFilter(response, requestingUser, pipelineStage) {

  if (requestingUser.role === 'ADMIN') {
    return response;  // Admin sees everything — no filtering
  }

  if (requestingUser.role === 'SCHOOL') {
    // Schools NEVER see contact info, regardless of stage
    delete response.candidate.contactNo;
    delete response.candidate.email;
    delete response.candidate.whatsappNo;
    delete response.candidate.address;

    if (pipelineStage === 'MATCHED') {
      // Before push — hide name, DOB, gender
      delete response.candidate.name;
      delete response.candidate.dob;
      delete response.candidate.gender;
    }
    // After push — name, DOB, gender are visible (admin unlocked them)
  }

  if (requestingUser.role === 'CANDIDATE') {
    // Candidates never see school match data before being pushed
    if (pipelineStage === null || pipelineStage === 'MATCHED') {
      return null;  // No data — candidate doesn't know they're matched
    }
  }

  return response;
}
```

**Why this is middleware and not controller logic:**  
If every controller manually strips fields, a single developer oversight exposes contact info to a school. A centralized filter makes it impossible to forget.

### 3.4 Endpoint-Level Permission Table

| Endpoint Pattern | ADMIN | SCHOOL | CANDIDATE | Notes |
|-----------------|:-----:|:------:|:---------:|-------|
| `GET /candidates/:id` | Full profile | Privacy-filtered | Own profile only | School sees filtered data based on pipeline stage |
| `POST /requirements` | ✅ | ✅ Own | ❌ | Schools create their own requirements |
| `POST /shortlists` | ✅ | ✅ Own requirements | ❌ | School can only shortlist from their own matches |
| `POST /candidates/:id/push` | ✅ | ❌ | ❌ | Only admin pushes |
| `GET /messages/threads/:id` | ✅ Read-only | Own threads only | Own threads only | Admin reads for moderation but cannot write |
| `POST /messages/threads/:id/send` | ❌ | Own threads | Own threads | Admin CANNOT send messages |
| `POST /users/:id/dismiss` | ✅ | ❌ | ❌ | Admin only, requires reason |
| `POST /candidates/:id/unlock` | ✅ | ❌ | ❌ | Admin only |
| `GET /reports/:type` | All types | Own school reports | ❌ | Different report catalog per role |

---

## 4. Database Schema Design

### 4.1 Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    users      │       │     schools       │       │   candidates     │
│──────────────│       │──────────────────│       │──────────────────│
│ id (PK)       │──┐   │ id (PK)           │       │ id (PK)          │
│ email          │  │   │ user_id (FK→users)│       │ user_id (FK)     │
│ phone          │  ├──▶│ school_name       │       │ name             │
│ password_hash  │  │   │ affiliation_no    │       │ contact_no  🔒   │
│ role (enum)    │  │   │ address           │       │ email       🔒   │
│ status         │  │   │ location          │       │ gender           │
│ created_at     │  │   │ pin_code          │       │ dob              │
│ updated_at     │  │   │ contact_no        │       │ address     🔒   │
│ deleted_at     │  │   │ email             │       │ primary_role     │
└───────────────┘  │   │ principal         │       │ qualifications   │
                   │   │ strength          │       │ experience (JSON)│
                   │   │ school_level      │       │ expected_salary  │
                   │   │ board             │       │ location_interested│
                   │   │ payment_status    │       │ status (enum)    │
                   │   │ is_free_tier      │       │  ACTIVE/PUSHED/  │
                   │   └──────────────────┘       │  LOCKED/DISMISSED│
                   │                               └────────┬─────────┘
                   │   ┌──────────────────┐                  │
                   │   │  requirements     │                  │
                   │   │──────────────────│                  │
                   │   │ id (PK)           │                  │
                   │   │ school_id (FK)    │                  │
                   │   │ subjects          │                  │
                   │   │ post_designation  │                  │
                   │   │ gender_pref       │                  │
                   │   │ staff_type        │                  │
                   │   │ qualification     │                  │
                   │   │ experience_min    │                  │
                   │   │ count_needed      │                  │
                   │   │ status            │                  │
                   │   └───────┬──────────┘                  │
                   │           │                              │
                   │   ┌───────▼──────────┐                  │
                   │   │   shortlists      │                  │
                   │   │──────────────────│                  │
                   │   │ id (PK)           │                  │
                   │   │ requirement_id(FK)│◀─────────────────┤
                   │   │ candidate_id (FK) │──────────────────┘
                   │   │ status (enum)     │
                   │   │  PENDING/APPROVED/│
                   │   │  REJECTED         │
                   │   │ admin_notes       │
                   │   └───────┬──────────┘
                   │           │
                   │   ┌───────▼──────────┐
                   │   │   pipelines       │    ← Only 1 ACTIVE per candidate
                   │   │──────────────────│
                   │   │ id (PK)           │
                   │   │ shortlist_id (FK) │
                   │   │ candidate_id (FK) │
                   │   │ school_id (FK)    │
                   │   │ status (enum)     │
                   │   │  ACTIVE/RELEASED/ │
                   │   │  SELECTED/TIMEOUT │
                   │   │ pushed_at         │
                   │   │ released_at       │
                   │   │ release_reason    │
                   │   └───────┬──────────┘
                   │           │
          ┌────────┼───────────┼──────────────┐
          ▼        │           ▼              ▼
   ┌───────────┐   │   ┌──────────────┐  ┌──────────────┐
   │  lock_ins  │   │   │   threads     │  │  interviews  │
   │───────────│   │   │──────────────│  │──────────────│
   │ id (PK)    │   │   │ id (PK)       │  │ id (PK)      │
   │ pipeline_id│   │   │ pipeline_id   │  │ pipeline_id  │
   │ candidate  │   │   │ school_id     │  │ scheduled_at │
   │ school_id  │   │   │ candidate_id  │  │ mode (enum)  │
   │ locked_at  │   │   │ status        │  │  ONLINE/     │
   │ expires_at │   │   │ created_at    │  │  OFFLINE     │
   │ unlocked_by│   │   └──────┬───────┘  │ status       │
   │ status     │   │          │           │ invite_sent  │
   └───────────┘   │   ┌──────▼───────┐   └──────────────┘
                   │   │   messages    │
                   │   │──────────────│
                   │   │ id (PK)      │
                   │   │ thread_id(FK)│
                   │   │ sender_id    │
                   │   │ content      │
                   │   │ type (enum)  │
                   │   │  TEXT/FILE/  │
                   │   │  TEMPLATE/   │
                   │   │  SYSTEM      │
                   │   │ is_flagged   │
                   │   │ read_at      │
                   │   │ created_at   │
                   │   └─────────────┘
                   │
                   │   ┌──────────────────┐
                   │   │   audit_logs      │
                   │   │──────────────────│
                   │   │ id (PK)           │
                   │   │ user_id (FK)      │
                   │   │ action (enum)     │
                   │   │ resource_type     │
                   │   │ resource_id       │
                   │   │ old_values (JSON) │
                   │   │ new_values (JSON) │
                   │   │ ip_address        │
                   │   │ timestamp         │
                   │   └──────────────────┘
                   │
                   │   ┌──────────────────┐
                   │   │   feedbacks       │
                   │   │──────────────────│
                   │   │ id (PK)           │
                   │   │ pipeline_id (FK)  │
                   │   │ reviewer_role     │ (SCHOOL or CANDIDATE)
                   │   │ rating (1-5)      │
                   │   │ comment           │
                   │   │ created_at        │
                   └──▶│ visibility: ADMIN │ ← NEVER shown to users
                       └──────────────────┘
```

🔒 = Field NEVER exposed to schools via API. Enforced by privacy filter middleware.

### 4.2 Critical Constraints

```sql
-- 1. Single-pipeline: Only one ACTIVE pipeline per candidate at any time
CREATE UNIQUE INDEX idx_one_active_pipeline
  ON pipelines (candidate_id)
  WHERE status = 'ACTIVE';

-- 2. No duplicate shortlists per requirement-candidate pair
CREATE UNIQUE INDEX idx_unique_shortlist
  ON shortlists (requirement_id, candidate_id);

-- 3. One active lock-in per candidate
CREATE UNIQUE INDEX idx_one_active_lockin
  ON lock_ins (candidate_id)
  WHERE status = 'ACTIVE';

-- 4. Prevent messaging in threads that are closed
-- Enforced at application layer (middleware checks thread.status before INSERT)

-- 5. User email uniqueness across the platform
CREATE UNIQUE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL;

-- 6. User phone uniqueness within each role
CREATE UNIQUE INDEX idx_users_phone_role ON users (phone, role) WHERE deleted_at IS NULL;
```

### 4.3 Indexing Strategy

```sql
-- Matching: Find active candidates by role and location
CREATE INDEX idx_candidates_match
  ON candidates (primary_role, status)
  WHERE status = 'ACTIVE';

CREATE INDEX idx_candidates_location
  ON candidates USING GIN (location_interested);

-- Admin: Pending shortlists (most common admin query)
CREATE INDEX idx_shortlists_pending
  ON shortlists (status, created_at)
  WHERE status = 'PENDING';

-- Chat: Messages by thread, most recent first
CREATE INDEX idx_messages_thread_time
  ON messages (thread_id, created_at DESC);

-- Lock-in: Find expiring lock-ins for cron job
CREATE INDEX idx_lockins_expiry
  ON lock_ins (expires_at)
  WHERE status = 'ACTIVE';

-- Pipeline: Active pipelines for timeout checking
CREATE INDEX idx_pipelines_active
  ON pipelines (status, pushed_at)
  WHERE status = 'ACTIVE';

-- Audit: By user and time range
CREATE INDEX idx_audit_user_time
  ON audit_logs (user_id, timestamp DESC);
```

### 4.4 Data Integrity Rules

| Rule | Implementation |
|------|---------------|
| **No hard deletes** | All tables have `deleted_at`. Soft-delete everywhere. |
| **Audit everything** | Every INSERT, UPDATE, DELETE → row in `audit_logs` with old/new values |
| **Data retention** | Financial records: 7 years (GST). Messages: 3 years. User profiles: indefinite. Video recordings: NOT stored server-side (local recording only). |
| **Cascade behavior** | User dismissed → mark all their pipelines as RELEASED, close threads, preserve messages |
| **Timezone** | All timestamps stored in UTC. Converted to IST in frontend only. |

---

## 5. API Design & Contracts

### 5.1 Endpoint Catalog

```
AUTH
  POST   /api/v1/auth/register              → Create account + send OTP
  POST   /api/v1/auth/verify-otp            → Verify phone + email OTP
  POST   /api/v1/auth/login                 → Email/phone + password → tokens
  POST   /api/v1/auth/refresh               → Rotate refresh token → new access token
  POST   /api/v1/auth/logout                → Revoke tokens
  POST   /api/v1/auth/forgot-password       → Send password reset OTP
  POST   /api/v1/auth/reset-password        → Verify OTP + set new password
  PUT    /api/v1/auth/change-password       → Old password + new password

SCHOOL
  GET    /api/v1/schools/profile             → Own school profile
  PUT    /api/v1/schools/profile             → Update school details
  POST   /api/v1/schools/requirements        → Create a job requirement
  GET    /api/v1/schools/requirements        → List own requirements (paginated)
  GET    /api/v1/schools/requirements/:id    → Single requirement detail
  PUT    /api/v1/schools/requirements/:id    → Edit requirement (only if no matches yet)
  GET    /api/v1/schools/matches/:reqId      → Get matched candidates (privacy-filtered)
  POST   /api/v1/schools/shortlist           → Shortlist candidates (= formal request)
  GET    /api/v1/schools/dashboard           → Dashboard stats + active pipelines
  GET    /api/v1/schools/reports/:type       → School-level reports

CANDIDATE
  GET    /api/v1/candidates/profile          → Own full profile
  PUT    /api/v1/candidates/profile          → Update profile
  GET    /api/v1/candidates/dashboard        → Dashboard (visible after first push only)
  GET    /api/v1/candidates/match-scores     → Match score trends over time
  GET    /api/v1/candidates/push-history     → All pipelines with status
  GET    /api/v1/candidates/profile-views    → Anonymized view count

ADMIN
  GET    /api/v1/admin/schools               → All schools (paginated, filterable)
  GET    /api/v1/admin/candidates            → All candidates (paginated, filterable)
  GET    /api/v1/admin/requirements          → All requirements across all schools
  GET    /api/v1/admin/shortlists/pending    → Pending shortlist approvals
  POST   /api/v1/admin/shortlists/:id/approve
  POST   /api/v1/admin/shortlists/:id/reject → With reason
  POST   /api/v1/admin/pipelines/push        → Push candidate to school
  POST   /api/v1/admin/pipelines/:id/release → Manual release with reason
  POST   /api/v1/admin/lock-ins/:id/unlock   → Override lock-in (with documented reason)
  POST   /api/v1/admin/users/:id/dismiss     → Ban user (with documented reason)
  GET    /api/v1/admin/moderation/flagged    → Flagged messages queue
  GET    /api/v1/admin/reports/:type         → Admin-level reports
  PUT    /api/v1/admin/config/fee            → Update registration fee amount

MESSAGING
  GET    /api/v1/messages/threads            → List user's threads
  GET    /api/v1/messages/threads/:id        → Thread messages (paginated)
  POST   /api/v1/messages/threads/:id/send   → Send message (text or template)
  POST   /api/v1/messages/threads/:id/upload → Upload file attachment

INTERVIEWS
  POST   /api/v1/interviews/schedule         → Schedule interview (date, time, mode)
  POST   /api/v1/interviews/:id/invite       → Send formal email invite
  PUT    /api/v1/interviews/:id/reschedule   → Update date/time
  GET    /api/v1/interviews/:id/join         → Get WebRTC room credentials

PAYMENTS
  POST   /api/v1/payments/create-order       → Create Razorpay order
  POST   /api/v1/payments/verify             → Verify payment after completion
  GET    /api/v1/payments/status              → Check payment status
  POST   /api/v1/webhooks/razorpay           → Razorpay webhook (signature-verified, no JWT)

NOTIFICATIONS
  GET    /api/v1/notifications                → List notifications (paginated)
  PUT    /api/v1/notifications/read           → Mark as read (batch)
  GET    /api/v1/notifications/preferences   → Get notification preferences
  PUT    /api/v1/notifications/preferences   → Update notification preferences

FEEDBACK
  POST   /api/v1/feedback                     → Submit post-placement rating (1-5 + comment)
```

### 5.2 Request/Response Standards

**Success Response:**
```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 347,
    "hasNext": true
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "CANDIDATE_ALREADY_IN_PIPELINE",
    "message": "This candidate is currently in an active pipeline and cannot be pushed.",
    "httpStatus": 409
  }
}
```

**Rules:**
- Never expose stack traces, SQL errors, or internal paths in error responses
- Never include other users' IDs in error messages
- All list endpoints support pagination (`page`, `limit`, default 20, max 100)
- All timestamps in ISO 8601 UTC format
- API versioned at `/api/v1/` — breaking changes require `/api/v2/`

---

## 6. Security Hardening

### 6.1 SQL Injection Prevention

**Strategy: Defense in Depth (3 layers)**

| Layer | What | How |
|-------|------|-----|
| **Layer 1: Input validation** | Reject bad data before it enters the system | Zod schemas validate every request body. Regex for phones, emails, pin codes. Max lengths on all strings. |
| **Layer 2: ORM** | Never write raw SQL | Prisma as primary data access layer. Auto-parameterizes all queries. |
| **Layer 3: Database** | Minimize damage if layers 1 & 2 fail | App DB user has only SELECT/INSERT/UPDATE on application tables. No DROP, ALTER, TRUNCATE. Separate migration user for schema changes. Query timeout: 30 seconds. |

```javascript
// NEVER THIS:
const q = `SELECT * FROM candidates WHERE email = '${input}'`;

// ALWAYS THIS (Prisma):
const candidate = await prisma.candidate.findUnique({
  where: { email: validatedInput }
});

// If raw SQL is unavoidable (complex reports), use parameterized:
const data = await prisma.$queryRaw`
  SELECT c.primary_role, COUNT(*) as total
  FROM candidates c
  WHERE c.location = ${location}
  GROUP BY c.primary_role
`;
```

### 6.2 XSS Prevention

| Attack Vector | Defense |
|--------------|---------|
| Rendered user content | React auto-escapes JSX output. Never use `dangerouslySetInnerHTML`. |
| Chat messages | DOMPurify sanitization on server before storage + React auto-escape on render |
| File names | Sanitized on upload (strip special chars, replace with UUID) |
| URL parameters | Validated against allowlist before use |
| Injected scripts via file uploads | Server-side MIME type check (magic bytes, not just extension). No HTML/SVG uploads. |

**Content Security Policy (CSP):**
```
default-src 'self';
script-src 'self' https://checkout.razorpay.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https://*.s3.amazonaws.com;
media-src 'self';
connect-src 'self' wss://chat.yourplatform.com https://api.razorpay.com;
frame-src 'none';
object-src 'none';
base-uri 'self';
```

### 6.3 CSRF Prevention

- All auth cookies: `SameSite=Strict`, `httpOnly`, `Secure`
- State-changing requests (POST/PUT/DELETE) require CSRF token in `X-CSRF-Token` header
- CSRF token generated per session, stored in double-submit cookie
- All GET requests are side-effect-free (safe methods only)

### 6.4 Contact Information Leak Detection (Business-Critical)

This is the most important security feature from a business perspective. The entire value of the platform depends on schools and candidates NOT being able to exchange contact info directly.

```javascript
const LEAK_PATTERNS = [
  // Phone numbers
  { pattern: /\b[6-9]\d{9}\b/,               label: 'Indian phone number' },
  { pattern: /\+91[\s-]?\d{10}/,              label: 'Indian phone with country code' },
  { pattern: /\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/, label: 'Formatted phone number' },

  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    label: 'Email address' },

  // Social / messaging platforms
  { pattern: /(?:whatsapp|whats\s*app|wa)\s*(?:no|number|#)?[\s:.-]*\d*/i,
    label: 'WhatsApp reference' },
  { pattern: /wa\.me\/\d+/i,                  label: 'WhatsApp link' },
  { pattern: /t\.me\/[a-zA-Z0-9_]+/i,         label: 'Telegram link' },
  { pattern: /(?:telegram|signal|skype|zoom|meet)[\s:]/i,
    label: 'External platform mention' },

  // Video call links
  { pattern: /meet\.google\.com\/[a-z-]+/i,   label: 'Google Meet link' },
  { pattern: /zoom\.us\/j\/\d+/i,             label: 'Zoom link' },

  // Obfuscation attempts
  { pattern: /\b\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d\b/,
    label: 'Obfuscated 10-digit number' },
  { pattern: /\bat\s+(?:the\s+rate|gmail|yahoo|hotmail|outlook)/i,
    label: 'Spelled-out email' },
];

function scanAndFlagMessage(content, messageId, senderId) {
  const detectedLeaks = [];

  for (const { pattern, label } of LEAK_PATTERNS) {
    if (pattern.test(content)) {
      detectedLeaks.push(label);
    }
  }

  if (detectedLeaks.length > 0) {
    // Message is STILL SENT (don't block communication)
    // But it is flagged for admin review
    flagMessageForAdmin(messageId, senderId, detectedLeaks);
  }

  return detectedLeaks;
}
```

**Why flag and not block?** Blocking creates false positives (e.g., "I have 10 years of experience" contains 10 digits). Flagging + admin review is more accurate and less disruptive.

### 6.5 Rate Limiting

| Endpoint | Limit | Window | Key | Penalty on Exceed |
|----------|-------|--------|-----|-------------------|
| `POST /auth/register` | 3 | per hour | IP address | Block IP for 1 hour |
| `POST /auth/verify-otp` | 3 attempts | per OTP | Phone + email | Invalidate OTP, request a new one |
| `POST /auth/login` | 5 attempts | 15 min | User ID | Lock account for 15 min |
| `POST /auth/forgot-password` | 3 | per hour | Email | Silent rate limit (no info leak) |
| All authenticated endpoints | 100 | per min | User ID | 429 Too Many Requests |
| All unauthenticated endpoints | 20 | per min | IP address | 429 Too Many Requests |
| `GET /matches/:reqId` | 10 | per min | School ID | Queued with 429 |
| `POST /messages/send` | 30 | per min | User ID | Throttle + flag for spam |
| `POST /messages/upload` | 5 | per min | User ID | 429 (max 10MB per file) |
| `POST /payments/create-order` | 3 | per hour | School ID | Block + notify admin |
| `GET /reports/:type` | 5 | per hour | User ID | Queued processing |
| Razorpay webhook | 50 | per min | IP (Razorpay IPs only) | Log + alert |

**Implementation:** Redis sliding-window algorithm via `rate-limiter-flexible` library.

### 6.6 Additional Protections

| Protection | Implementation |
|-----------|---------------|
| **DDoS** | Cloudflare WAF with Under Attack Mode enabled |
| **Bot detection** | hCaptcha on registration forms (privacy-focused alternative to reCAPTCHA) |
| **Request body limit** | 10MB max (Express `body-parser` limit) |
| **Slow-loris mitigation** | Connection timeout: 30 seconds, keep-alive timeout: 5 seconds |
| **HTTP headers** | Helmet.js (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy: strict-origin`) |
| **Dependency security** | `npm audit` in CI pipeline. Dependabot alerts enabled. |
| **Secrets management** | Environment variables only. Never in code. `.env` in `.gitignore`. Production secrets in AWS Secrets Manager. |

---

## 7. Edge Cases & Business Logic Safety Nets

### 7.1 Registration

| # | Scenario | What Could Go Wrong | Handling |
|---|----------|-------------------|---------|
| 1 | Email already exists | Reveals that the email is registered (email enumeration) | Generic response: "If this email is registered, you'll receive instructions." Same timing regardless. |
| 2 | OTP expires | User stuck | Show "OTP expired" → clear old OTP from Redis → allow new request |
| 3 | Rapid OTP spam | OTP service abuse, cost implications | 3 OTPs per 15 min per phone. Counter in Redis. |
| 4 | 200th school — free or paid? | Off-by-one error changes revenue | Atomic Redis `INCR`. ≤200 = free, >200 = paid. Counter persisted to DB on each registration. |
| 5 | Payment succeeds, OTP verification fails | School paid but can't access | Payment captured. Allow login with "complete verification" flow. If no verification in 24h → auto-refund via Razorpay. |
| 6 | Browser crashes mid-registration | Lost progress | Partial form state saved in `localStorage`. Server-side: incomplete records (no OTP verified) cleaned by daily cron. |
| 7 | School tries to register after being dismissed | Account circumvention | Blacklist check on phone + email. Show "Contact support." |
| 8 | Same phone used for school and candidate | Legitimate dual role | Allowed — phone is unique within role, not globally. `UNIQUE(phone, role)` constraint. |
| 9 | Admin changes fee while school is in payment flow | Price mismatch | Fee is locked at Razorpay order creation time. Admin change only affects NEW orders. |

### 7.2 Matching & Shortlisting

| # | Scenario | Handling |
|---|----------|---------|
| 1 | Zero candidates match | Show "No matches found" + AI suggestions: "Try relaxing experience requirement from 5 years to 3 years." |
| 2 | School shortlists a candidate who was just pushed to another school | Block with message: "Candidate is currently in an active pipeline. You'll be notified when they become available." |
| 3 | Two schools shortlist same candidate simultaneously | Both shortlists reach admin. Admin decides priority. The second request is queued (not rejected). |
| 4 | Candidate updates profile after being matched | Match scores recalculate on next query. School sees "Updated" badge on candidate card. |
| 5 | School edits requirement after candidates already matched | Allowed ONLY if no shortlists exist for this requirement. If shortlists exist → create a new requirement instead. |
| 6 | Candidate deletes a qualification that was key to a match | Match score drops. If candidate is in active pipeline, no effect (pipeline already approved). |

### 7.3 Pipeline & Communication

| # | Scenario | Handling |
|---|----------|---------|
| 1 | School sends a message at Day 6 — does the 7-day timer reset? | **Yes.** Any message from the school resets the timer. The rule is "7 consecutive days of school silence." |
| 2 | Candidate goes silent after push | Does NOT trigger auto-release. Only school inactivity triggers it. School can manually release if candidate is unresponsive. |
| 3 | School releases candidate, then wants them back | Must go through shortlist → admin approve → push again. No "undo release." History is preserved. |
| 4 | School confirms selection but candidate was already released (race condition) | Optimistic locking: `UPDATE pipelines SET status='SELECTED' WHERE id=X AND status='ACTIVE'`. If affected_rows = 0 → "Candidate is no longer in this pipeline." |
| 5 | Video call drops mid-interview | WebRTC auto-reconnect (30s retry). If reconnect fails, interview can be rescheduled via chat. Partial recording saved. |
| 6 | Message contains virus-infected file | ClamAV scans file server-side before S3 upload. Infected files rejected with "File could not be uploaded. Please try a different file." |
| 7 | Admin tries to push a candidate who is already in a pipeline | System blocks: "Candidate is currently in pipeline with [School Name]. Release required first." Enforced by `idx_one_active_pipeline` unique index. |
| 8 | Feedback not submitted before deactivation deadline | Deactivation proceeds after 48 hours. Reminder at 24 hours. Feedback logged as "SKIPPED". |
| 9 | School sends interview invite with wrong details | Candidate requests change via chat. School sends new invite (old marked "SUPERSEDED"). Both logged. |
| 10 | School tries to message after candidate is released | Thread is CLOSED on release. Error: "This conversation has ended." |

### 7.4 Payments

| # | Scenario | Handling |
|---|----------|---------|
| 1 | Payment succeeds but webhook doesn't arrive | Razorpay retries webhooks for 24 hours. Reconciliation cron runs every 30 min, calls Razorpay API to check order status. |
| 2 | Double payment (user clicks pay twice) | Idempotency key on Razorpay order. Same school + same registration = same order ID. Second payment auto-refunded. |
| 3 | User abandons payment page | Order expires after 30 minutes (Razorpay default). School can retry. No duplicate charge. |
| 4 | Razorpay API is down | Show "Payment service temporarily unavailable. Your registration is saved. Complete payment later from your dashboard." |

### 7.5 Lock-in

| # | Scenario | Handling |
|---|----------|---------|
| 1 | Lock-in expires on weekend / holiday | Auto-reactivation cron runs every 5 minutes. No human dependency. |
| 2 | Admin unlocks a candidate who's already auto-reactivated | No-op. Admin sees "Candidate is already active." |
| 3 | School that hired a candidate gets dismissed | Lock-in remains — the placement happened. Admin can manually override if warranted. All documented. |
| 4 | Candidate creates new account during lock-in | Phone + email uniqueness check blocks re-registration. |
| 5 | Candidate appeals for early unlock without proper details | Template rejection: "Please provide: reason, original school, placement date, and supporting details." |

---

## 8. Real-Time Communication Engine

### 8.1 Architecture

```
Client (Browser)
    │
    ├── Socket.io client (auto-reconnect enabled)
    │       │
    │       ▼
    │   Socket.io Server (separate process from REST API)
    │       │
    │       ├── Auth middleware: verify JWT on connection
    │       ├── Room management: user joins `thread:{threadId}` rooms
    │       ├── Events:
    │       │     message:send    → Save to DB → Broadcast to room → Flag check
    │       │     message:read    → Update read_at → Notify sender
    │       │     typing:start    → Broadcast to room
    │       │     typing:stop     → Broadcast to room
    │       │     thread:joined   → User entered thread
    │       │     thread:left     → User left thread
    │       │
    │       └── Admin read-access: admin can join ANY thread room (read-only)
    │
    └── WebRTC (for video calls)
            │
            ├── Signaling via Socket.io (offer/answer/ICE candidates)
            ├── TURN/STUN server for NAT traversal
            └── Media streams: peer-to-peer when possible, relayed via TURN when not
```

### 8.2 Connection Handling

| Aspect | Behavior |
|--------|----------|
| **Auth** | JWT verified on WebSocket handshake. Invalid/expired token → connection refused. |
| **Reconnection** | Exponential backoff: 1s → 2s → 4s → 8s → max 30s. Auto-resync missed messages on reconnect. |
| **Heartbeat** | Ping every 25 seconds. 3 missed pings → connection dropped server-side. |
| **Offline messages** | Messages are persisted to DB first, then broadcast. Offline users see them on next load. |
| **Thread access** | User can only join rooms for threads they are a party to (server-side check on `join_thread`). |
| **Admin access** | Admin can join any room with `read-only` flag. Cannot emit `message:send`. |

### 8.3 Video Interview (WebRTC)

| Aspect | Detail |
|--------|--------|
| **Signaling** | Via Socket.io (offer, answer, ICE candidate exchange) |
| **TURN/STUN** | Coturn server on dedicated instance. Time-limited credentials generated by API (valid 6 hours). |
| **Recording** | **Local recording only (Zoom-style)** — the platform does NOT store recordings on its servers. Recording uses `MediaRecorder` API and saves directly to the user's device. |
| **Recording permissions** | **Host-controlled** — the school (host) has full recording control. Participants (candidates) can only record if the host explicitly grants them permission during the call. By default, participant recording is disabled. The host can toggle "Allow participant recording" on/off at any time during the session. |
| **Why no server recording** | Recordings are of no use to the company. Storing video is expensive (bandwidth + S3 storage) and creates unnecessary data liability. Local recording gives participants control while keeping the company's infra lean. |
| **Quality** | Adaptive bitrate. Fallback to audio-only if bandwidth is low. |
| **Duration** | Max 2 hours per session (prevents runaway connections). |
| **Recording indicator** | When anyone is recording, all participants see a visible "Recording in progress" indicator (mandatory — cannot be hidden). This ensures transparency regardless of who initiated the recording. |

---

## 9. File Handling & Media Security

| Check | Detail |
|-------|--------|
| **Allowed types** | PDF, DOCX, JPEG, PNG, WebP |
| **Max file size** | 10 MB per file |
| **Daily limit** | 50 MB per user per day |
| **Max attachments per message** | 5 files |
| **MIME validation** | Server-side magic byte check (not just extension). Uses `file-type` npm package. |
| **Virus scan** | ClamAV scan before S3 upload. Infected files rejected. |
| **Filename sanitization** | Original filename stored as metadata. Actual storage key: `{threadId}/{uuid}.{ext}` |
| **EXIF stripping** | All images processed through `sharp` to remove EXIF metadata (prevents GPS location leaks) |
| **Storage** | Private S3 bucket. No public access. |
| **Access** | Pre-signed URLs generated by API (valid 1 hour). Permission check on every download request. |
| **No executable uploads** | `.exe`, `.sh`, `.bat`, `.js`, `.html`, `.svg` — all blocked |

---

## 10. Background Jobs & Scheduled Tasks

| Job | Schedule | What It Does |
|-----|----------|-------------|
| **7-Day Auto-Release** | Every 5 min | Find active pipelines where `pushed_at + 7 days < now()` AND no school message in 7 days → release candidate, notify all parties. |
| **Day 3 & Day 5 Warnings** | Every 5 min | Find active pipelines at Day 3 and Day 5 of school silence → send warning to school (email + in-app + SMS). |
| **Lock-in Expiry** | Every 5 min | Find lock-ins where `expires_at < now()` → reactivate candidate, update status, notify. |
| **Payment Reconciliation** | Every 30 min | Find orders in "CREATED" state older than 30 min → check Razorpay API → mark as PAID or EXPIRED. Auto-refund if payment captured but registration incomplete. |
| **Stale Registration Cleanup** | Daily at 2 AM IST | Delete unverified registration attempts older than 24 hours. |
| **Notification Digest** | Daily at 8 AM IST | Send email digest of unread notifications to users who haven't logged in recently. |
| **Match Score Recalculation** | On demand (triggered by profile update) + Weekly batch for all active candidates | Ensures match scores reflect latest profile data. |
| **Audit Log Archival** | Monthly | Move audit logs older than 6 months to cold storage (S3 archive). |
| ~~Video Recording Cleanup~~ | N/A | Removed — recordings are local-only, not stored on company servers. |

**Technology:** Bull queue (backed by Redis) for reliable job processing with retry logic.

---

## 11. Caching Strategy

| What's Cached | Where | TTL | Invalidation |
|--------------|-------|-----|-------------|
| **School profile** | Redis | 15 min | On profile update |
| **Candidate profile (professional fields)** | Redis | 10 min | On profile update |
| **Free school counter** | Redis | Permanent (source of truth for atomicity) | INCR on each registration |
| **Match results** | Redis | 5 min | On new candidate registration or profile update |
| **Notification preferences** | Redis | 30 min | On preference update |
| **Rate limit counters** | Redis | Sliding window (varies per endpoint) | Auto-expire |
| **OTP** | Redis | 5 min TTL | Used or expired |
| **Refresh token blacklist** | Redis | TTL = remaining token expiry | Auto-expire |
| **Admin dashboard stats** | Redis | 2 min | On any pipeline status change |

**What's NOT cached (must always be fresh):**
- Pipeline status (single-pipeline integrity)
- Message threads (real-time requirement)
- Lock-in status
- Payment status
- Moderation flags

---

## 12. Monitoring, Logging & Alerting

### 12.1 Structured Logging

```json
{
  "timestamp": "2026-04-13T00:30:00.000Z",
  "level": "info",
  "service": "api",
  "requestId": "uuid",
  "userId": "uuid",
  "method": "POST",
  "path": "/api/v1/admin/pipelines/push",
  "statusCode": 200,
  "responseTimeMs": 145,
  "message": "Candidate pushed to pipeline"
}
```

**PII Masking Rules:**
- Phone numbers: `98****1234`
- Emails: `ch****@gmail.com`
- Passwords: NEVER logged, even masked
- File contents: NEVER logged

### 12.2 Key Metrics & Alert Thresholds

| Metric | Alert If | Severity |
|--------|---------|----------|
| API P95 response time | > 2 seconds | Warning |
| API P99 response time | > 5 seconds | Critical |
| 5xx error rate | > 1% of requests | Critical |
| WebSocket active connections | > 80% capacity | Warning |
| Failed OTP attempts from single IP | > 10 in 5 minutes | Critical (possible attack) |
| Auto-flagged messages rate | > 50 per hour | Warning (possible coordinated abuse) |
| DB connection pool utilization | > 80% | Warning |
| Redis memory usage | > 70% | Warning |
| Payment webhook failure rate | > 5% | Critical |
| Matching engine latency | > 5 seconds | Warning |
| Disk usage (S3 files) | > 80% of allocated | Warning |
| Job queue depth (Bull) | > 100 pending jobs | Warning |
| TURN server availability | Down for > 30 seconds | Critical (video calls broken) |

### 12.3 Health Endpoints

```
GET /health          → { "status": "ok" }
GET /health/ready    → Checks: PostgreSQL, Redis, S3, MSG91, SendGrid, TURN server
GET /health/metrics  → Prometheus-format metrics (internal access only, behind VPN)
```

---

## 13. Deployment, CI/CD & Rollback

### 13.1 Environments

| Environment | Purpose | Database | URL |
|-------------|---------|----------|-----|
| **Local** | Developer machines | Docker Compose (PostgreSQL + Redis) | localhost:3000 |
| **Staging** | Pre-release QA | Anonymized snapshot of production | staging.yourplatform.com |
| **Production** | Live users | Managed PostgreSQL (AWS RDS) | yourplatform.com |

### 13.2 CI/CD Pipeline

```
Developer pushes to feature branch
    → PR created → Code review required
    → CI runs:
        1. Lint (ESLint + Prettier)
        2. Type check (TypeScript)
        3. Unit tests (Jest)
        4. Integration tests (against test DB)
        5. Security audit (npm audit)
        6. Build (Next.js production build)
    → PR merged to main
    → Auto-deploy to Staging
    → Staging smoke tests (automated)
    → Manual QA approval
    → Deploy to Production (blue-green)
    → Post-deploy health check
    → Monitor for 30 minutes
    → If errors spike → auto-rollback to previous version
```

### 13.3 Rollback Strategy

| Strategy | How |
|----------|-----|
| **Blue-Green Deployment** | Two identical production environments. Traffic switches instantly. Rollback = switch back. |
| **Database migrations** | Always backward-compatible. Add columns (nullable), never delete/rename in the same release. Data migration in a separate release after code migration is stable. |
| **Feature flags** | High-risk features (video calls, email relay) behind feature flags. Gradual rollout: 5% → 25% → 50% → 100%. Kill switch for instant disable. |
| **Canary releases** | For major changes: deploy to 5% of traffic first, monitor for 1 hour, then full rollout. |

---

## 14. Legal Compliance & Data Governance

### 14.1 DPDP Act (India) — Digital Personal Data Protection

| Requirement | Our Implementation |
|-------------|-------------------|
| **Purpose limitation** | Data collected only for recruitment matching. Stated explicitly in privacy policy and registration consent. |
| **Consent** | Explicit checkbox at registration. Separate consents for OTP communication and email notifications. |
| **Data minimization** | Only collect fields defined in PRD. No tracking pixels, no third-party analytics sharing. |
| **Right to access** | `GET /api/v1/users/me/data-export` → generates downloadable JSON/PDF of all user data. |
| **Right to erasure** | `POST /api/v1/users/me/delete-request` → soft delete immediately, full anonymization after 90 days. |
| **Data localization** | All data stored in AWS Mumbai (ap-south-1). No cross-border data transfer. |
| **Breach notification** | Automated monitoring → Admin alerted within 1 hour → CERT-In notified within 6 hours (as per DPDP Act requirement). |
| **Data processor agreements** | DPAs signed with: Razorpay, MSG91/Twilio, SendGrid, AWS. |

### 14.2 Payment Compliance

| Standard | Implementation |
|----------|---------------|
| **PCI DSS** | No card data touches our servers. Razorpay's checkout.js handles all card input. We only store Razorpay order IDs and payment IDs. |
| **GST** | Auto-generated GST invoices for registration fees. GST number configurable by admin. |
| **Refund policy** | Clearly stated in Terms & Conditions. Refunds processed within 5-7 business days via Razorpay. |

### 14.3 Interview Email Relay — Legal Consideration

The formal interview invite is sent "from" the school's registered email. The platform uses SendGrid's email relay with the school's email as the sender (`from` field). This requires:
- School's explicit consent during registration (T&C covers email sending on their behalf)
- SPF/DKIM/DMARC records configured properly so emails don't land in spam
- If the school's domain doesn't have SPF records, the fallback is: `from: noreply@yourplatform.com`, `reply-to: school@schooldomain.com`

---

## 15. Performance Budgets

| Component | Target | How Measured |
|-----------|--------|-------------|
| Initial page load (LCP) | < 2.5 seconds | Lighthouse |
| Time to Interactive (TTI) | < 3.5 seconds | Lighthouse |
| JavaScript bundle size | < 200 KB (gzipped) | Webpack analyzer |
| API response (P50) | < 200 ms | APM (Datadog / New Relic) |
| API response (P95) | < 1 second | APM |
| AI matching query | < 5 seconds (up to 10,000 candidates) | Server-side timer |
| WebSocket message delivery | < 100 ms | Client-side measurement |
| WebRTC call setup | < 3 seconds | WebRTC internal stats |
| File upload (10 MB) | < 10 seconds | Client-side timer |
| Report generation | < 30 seconds | Background job timer |
| Database query (P95) | < 100 ms | Prisma query timing |
| Search/filter (school dashboard) | < 500 ms | E2E measurement |

---

## 16. Error Handling & Error Code Catalog

### 16.1 Error Categories

| HTTP Status | Category | When Used |
|-------------|---------|-----------|
| 400 | `VALIDATION_ERROR` | Bad request body, missing fields, wrong format |
| 401 | `AUTHENTICATION_ERROR` | Missing/expired/invalid token |
| 403 | `AUTHORIZATION_ERROR` | Valid user but insufficient permissions |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | Business logic conflict (e.g., candidate already in pipeline) |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error (never expose details) |
| 503 | `SERVICE_UNAVAILABLE` | Dependency down (DB, Redis, external service) |

### 16.2 Business-Specific Error Codes

| Code | HTTP | Message | Context |
|------|------|---------|---------|
| `CANDIDATE_IN_PIPELINE` | 409 | Candidate is currently in an active pipeline | Push blocked — single pipeline rule |
| `CANDIDATE_LOCKED_IN` | 409 | Candidate is currently locked in (placed) | Any action on a locked-in candidate |
| `SHORTLIST_ALREADY_EXISTS` | 409 | This candidate is already shortlisted for this requirement | Duplicate shortlist prevention |
| `THREAD_CLOSED` | 403 | This conversation has ended | Messaging after release/selection |
| `OTP_EXPIRED` | 400 | OTP has expired. Please request a new one | OTP TTL exceeded |
| `OTP_MAX_ATTEMPTS` | 429 | Too many incorrect attempts. Request a new OTP | 3 failed OTP entries |
| `ACCOUNT_LOCKED` | 403 | Account temporarily locked due to too many failed login attempts | 5 failed logins |
| `ACCOUNT_DISMISSED` | 403 | Your account has been suspended. Contact support. | Dismissed user trying to access |
| `PAYMENT_REQUIRED` | 402 | Registration fee payment is required to continue | School > 200 threshold |
| `FEE_ALREADY_PAID` | 409 | Registration fee has already been paid | Duplicate payment prevention |
| `REQUIREMENT_HAS_SHORTLISTS` | 409 | Cannot edit this requirement — candidates have already been shortlisted | Edit blocked after shortlisting |
| `FILE_TYPE_NOT_ALLOWED` | 400 | This file type is not supported | Unsupported MIME type |
| `FILE_INFECTED` | 400 | This file could not be uploaded. Please try a different file | ClamAV detected malware |
| `INTERVIEW_TIME_CONFLICT` | 409 | An interview is already scheduled at this time | Overlapping interview prevention |
