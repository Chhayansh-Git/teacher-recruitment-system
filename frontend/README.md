# 🎨 Teacher Recruitment System — Frontend Interface

This is the frontend user interface for the **Teacher Recruitment System**, built on top of [Next.js 14](https://nextjs.org/) (App Router) to deliver a lightning-fast, SEO-friendly, and highly secure user experience.

The UI is designed to serve three distinct roles (Candidates, Schools, and Administrators) through unified login flows and strictly segregated dashboard layouts.

## 🚀 Technology Highlights

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS for highly responsive, utility-first UI design
- **State Management**: React Context (`AuthContext`, `ToastContext`)
- **Real-time Engine**: Socket.io-client for instant chat & notification delivery
- **Fonts**: Optimized with `next/font` using [Geist](https://vercel.com/font)
- **Security**: Built-in CSRF token injection and JWT-based authentication flows

## 📁 Directory Architecture

```bash
frontend/
├── app/                  # Next.js App Router Pages
│   ├── admin/            # Administrator Dashboard & Reports
│   ├── candidate/        # Candidate Profile & Pipeline View
│   ├── school/           # School Requirements & Shortlisting
│   ├── login/            # Unified Authentication Flow
│   └── settings/         # Global User Settings (2FA, Sessions)
├── components/           # Reusable UI Elements (Modals, Sidebars, Pagination)
├── context/              # Global React Contexts
├── lib/                  # Utilities (e.g., Axios API Client wrapper)
└── public/               # Static assets (Images, Icons)
```

## 🛠️ Development Setup

### Prerequisites
Make sure the main backend API server is running on `http://localhost:5000` (or as defined in your `.env` configuration) before starting the frontend, as the UI heavily relies on the backend API for authentication and data fetching.

### Running the App

First, install the necessary dependencies:

```bash
npm install
```

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The application will automatically reload as you modify the source files.

## 🔒 Security Implementations in the UI

- **CSRF Token Injection**: The API client (`lib/api.js`) automatically reads the double-submit cookie and attaches the `X-CSRF-Token` header to all non-GET requests.
- **Route Protection**: The `<ProtectedRoute>` wrapper dynamically verifies the active user's JWT and Role, redirecting unauthorized traffic gracefully.
- **Dynamic 2FA**: The `login` interface natively supports progressive authentication. If an Admin signs in, it pauses the flow and renders an OTP verification form dynamically.

## 🚢 Building for Production

To create an optimized production build:

```bash
npm run build
```

After building, start the production server:

```bash
npm run start
```

## 🔗 Learn More

To learn more about the underlying technologies used in this frontend:
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Socket.io Client API](https://socket.io/docs/v4/client-api/)
