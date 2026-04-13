# Teacher Recruitment System

An AI-powered platform that acts as an intermediary between schools seeking teachers and candidates looking for teaching positions. The platform handles matching, communication, interviews, and placement — ensuring schools and candidates never exchange contact information directly.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js (React) + Tailwind CSS |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL + Prisma ORM |
| **Cache/Queue** | Redis + Bull |
| **AI/ML** | Python + FastAPI (matching engine) |
| **Real-Time** | Socket.io (chat) + WebRTC (video) |
| **Payments** | Razorpay |
| **Email** | SendGrid |
| **SMS** | MSG91 |

## Project Structure

```
teacher-recruitment-system/
├── src/                    # All source code
│   ├── routes/             # API route definitions
│   ├── controllers/        # Business logic handlers
│   ├── middleware/          # Auth, validation, privacy filter
│   ├── validators/         # Zod schemas for input validation
│   ├── services/           # Reusable business logic
│   ├── utils/              # Helper functions
│   └── config/             # App configuration
├── prisma/                 # Database schema & migrations
├── tests/                  # Test files
├── ml-service/             # Python matching engine
├── docs/                   # PRD, TDD, and other documentation
└── scripts/                # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js v22.16.0 (use `nvm use` to auto-switch)
- PostgreSQL 16
- Redis

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd teacher-recruitment-system

# Switch to correct Node version
nvm use

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start the development server
npm run dev
```

## Documentation

- [Product Requirements Document (PRD)](./PRD.pdf)
- [Technical Design Document (TDD)](./TDD_Teacher_Recruitment_System.md)
- [Learning Roadmap](./Roadmap.md)

## Branch Strategy

- `main` — Production-ready code
- `develop` — Integration branch
- `feature/*` — Feature branches (created from `develop`)

## License

Private — All rights reserved.
