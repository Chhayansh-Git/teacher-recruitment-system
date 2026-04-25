<div align="center">
  <h1>🎓 Teacher Recruitment System (TRS)</h1>
  <p><strong>AI-Powered Platform Connecting Schools with Top Teaching Talent</strong></p>
  
  [![Node.js](https://img.shields.io/badge/Node.js-v22-green.svg)](https://nodejs.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-5.22-blue.svg)](https://www.prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
  [![License](https://img.shields.io/badge/License-Private-red.svg)]()
</div>

<br />

The **Teacher Recruitment System** acts as a secure, intelligent intermediary between educational institutions seeking educators and candidates looking for teaching positions. 

By handling the entire recruitment pipeline—from AI-driven matching and secure communication to interview scheduling and final placement—the platform ensures **100% privacy**, ensuring schools and candidates never exchange personal contact information directly until a formal placement is locked in.

---

## ✨ Key Features

- 🧠 **Smart Matching Engine**: Automatically scores and ranks candidates against school requirements based on qualifications, experience, and salary expectations.
- 🔒 **Privacy-First Architecture**: Proprietary `Contact Leak Detector` intercepts and flags messages containing phone numbers, emails, or links to enforce platform integrity.
- 💬 **Secure Real-Time Chat**: Built-in messaging system (via Socket.io) allowing schools and candidates to communicate securely.
- 📹 **Integrated Interviews [Coming Soon]**: WebRTC-powered video interviewing system. *(Note: This feature is currently under construction as it requires the setup of a dedicated signaling and TURN/STUN server architecture. Please use external services like Google Meet or Zoom for interviews in the meantime.)*
- ⏳ **Automated Pipeline Management**: 7-day auto-release policies, 1-year placement lock-ins, and automated state transitions.
- 🔐 **Advanced Security**: Instagram-style trusted device recognition, 2FA for Admins, Session Revocation, CSRF protection, and strictly tailored Content Security Policies (CSP).
- 💳 **Seamless Payments**: Razorpay integration for school registration fees, fully configurable via the Admin dashboard.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend UI** | [Next.js (App Router)](https://nextjs.org) + [Tailwind CSS](https://tailwindcss.com) |
| **Backend API** | [Node.js](https://nodejs.org) + [Express](https://expressjs.com) |
| **Database** | [PostgreSQL](https://postgresql.org) (Cloud via Neon.tech) + [Prisma ORM](https://prisma.io) |
| **Cache & Queues**| [Redis](https://redis.io) + [Bull](https://optimalbits.github.io/bull/) |
| **Real-Time** | [Socket.io](https://socket.io) (Chat) + WebRTC (Video) |
| **Payments** | [Razorpay](https://razorpay.com) |

## 📂 Project Structure

```bash
teacher-recruitment-system/
├── frontend/               # Next.js 14 Web Application (UI)
├── src/                    # Node.js Backend API
│   ├── routes/             # API Endpoints
│   ├── controllers/        # Request Handlers
│   ├── services/           # Core Business Logic & AI Matching
│   ├── middleware/         # Security (Auth, CSRF, Privacy Filter)
│   ├── jobs/               # Bull Queue Background Workers
│   └── socket/             # Real-time WebSocket Handlers
├── prisma/                 # Database Schema & Migrations
├── ml-service/             # Python microservice (Future AI features)
└── tests/                  # Jest Test Suites
```

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js `v22.16.0` (Recommended to use `nvm`)
- PostgreSQL database (or a free cloud instance via [Neon.tech](https://neon.tech))
- Redis server running locally or via cloud

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd teacher-recruitment-system
   ```

2. **Install Backend Dependencies:**
   ```bash
   nvm use
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Environment Setup:**
   Duplicate the example environment file and fill in your database credentials:
   ```bash
   cp .env.example .env
   ```

5. **Database Initialization:**
   Sync the Prisma schema with your database and seed the initial Admin account:
   ```bash
   npx prisma migrate dev --name init
   npm run db:seed
   ```

### Running the Application

You need two terminal windows to run the full stack locally.

**Terminal 1 (Backend API):**
```bash
npm run dev
```
*(Server starts on `http://localhost:5000`)*

**Terminal 2 (Frontend App):**
```bash
cd frontend
npm run dev
```
*(UI starts on `http://localhost:3000`)*

## 🧪 Testing

The backend includes a comprehensive Jest test suite to verify route health and error handling architectures.

```bash
npm test
```

## 🛡️ Security & Compliance

This platform enforces strict data protection rules:
- **Zero Contact Policy**: Candidate contact details are stripped at the middleware level before reaching schools.
- **Double-Submit CSRF**: Protects all state-changing API operations.
- **Session Control**: Users can view remote active sessions and kill them instantly.
- **Helmet CSP**: Advanced Content Security Policy prevents XSS and data-injection attacks.

---

<div align="center">
  <i>Developed as a high-performance, patent-ready Minimum Viable Product (MVP).</i><br/>
  <b>Private Repository — All Rights Reserved.</b>
</div>
