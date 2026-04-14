# Tervix – Peer Mock Interview Platform

> A production-ready peer-to-peer DSA mock interview platform. Book same-day slots, conduct live sessions with shared code editing, and submit mandatory mutual feedback.

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), Tailwind CSS |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | Auth.js v5 (Credentials) |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) |
| **Code Execution** | Judge0 CE API via RapidAPI |
| **Deployment** | Vercel + Supabase (or Railway) |

---

## 📁 Project Structure

```
tervix/
├── app/
│   ├── (auth)/              # Login & Signup pages (no sidebar)
│   │   ├── login/
│   │   └── signup/
│   ├── (app)/               # Authenticated app pages (with sidebar)
│   │   ├── dashboard/       # Dashboard overview
│   │   ├── book-slot/       # Slot booking (today only)
│   │   ├── profile/         # User profile & stats
│   │   ├── history/         # Interview history
│   │   ├── interview/[id]/  # Live interview room
│   │   └── feedback/[id]/   # Post-interview feedback form
│   ├── api/                 # API routes
│   │   ├── auth/            # Auth.js handlers + signup
│   │   ├── slots/           # GET slots, POST book slot
│   │   ├── interviews/      # GET/PATCH interview, POST execute code
│   │   ├── feedback/        # POST/GET feedback
│   │   ├── dashboard/       # GET dashboard data
│   │   ├── profile/         # GET/PATCH profile
│   │   ├── history/         # GET booking history
│   │   └── questions/       # GET questions list
│   ├── layout.tsx
│   ├── page.tsx             # Root redirect
│   └── globals.css
├── components/
│   └── layout/
│       └── Sidebar.tsx
├── lib/
│   ├── auth.ts              # Auth.js configuration
│   ├── db.ts                # Prisma singleton
│   ├── slots.ts             # Slot time utilities
│   └── judge0.ts            # Code execution client
├── prisma/
│   ├── schema.prisma        # Full database schema
│   └── seed.ts              # 8 DSA questions seed
├── middleware.ts             # Auth-based route protection
└── .env.example
```

---

## 🚀 Local Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd tervix
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Optional for real code execution:
JUDGE0_API_URL="https://judge0-ce.p.rapidapi.com"
JUDGE0_API_KEY="your-rapidapi-key"
```

### 3. Set Up Database

```bash
# Push schema to database
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed DSA questions
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## ☁️ Deployment Guide

### Option A: Vercel + Supabase (Recommended)

#### Step 1: Set Up Supabase Database

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection string → URI**
3. Copy the connection string (use the **pooling** URL for serverless)

#### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set these environment variables in Vercel dashboard (**Settings → Environment Variables**):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Supabase connection string |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` output |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `JUDGE0_API_KEY` | Your RapidAPI key (optional) |

#### Step 3: Run Migrations on Production

```bash
# Set DATABASE_URL in your shell first
DATABASE_URL="your-supabase-url" npx prisma db push
DATABASE_URL="your-supabase-url" npx tsx prisma/seed.ts
```

---

### Option B: Vercel + Railway

1. Create a PostgreSQL database on [railway.app](https://railway.app)
2. Copy the `DATABASE_URL` from Railway dashboard
3. Follow the same Vercel deployment steps above

---

## 🎮 Features Walkthrough

### Authentication
- Email/password signup with 2-step onboarding (credentials → profile)
- Auth.js v5 JWT sessions
- Protected routes via middleware

### Slot Booking System
- 8 fixed 2-hour slots per day (08:30 → 22:30)
- Only future slots can be booked
- Maximum 2 users per slot
- Users blocked from booking if they have pending feedback
- First booker = Interviewer, Second booker = Candidate

### Automatic Interview Matching
- When slot reaches 2 participants, an `Interview` record is created
- A random DSA question is assigned
- Both `Booking` records are linked to the interview

### Interview Room
- Monaco Editor with Python syntax highlighting
- Code auto-saves every 5 seconds
- Role switching (Interviewer ↔ Candidate)
- Code execution via Judge0 API (falls back to mock if no API key)
- End Session → redirects both users to feedback

### Feedback System (Mandatory)
- Both users must submit feedback after each session
- Users with `pendingFeedback = true` are blocked from new bookings
- Ratings (1–10) for Candidate Performance and Peer Professionalism
- Minimum 50-character detailed observations

### Rating System
- Ratings are aggregated into `user.candidateRating` and `user.interviewerRating`
- Uses rolling average calculation
- Displayed on Dashboard and Profile pages

---

## 🗄️ Database Schema

```
users           – Auth + profile + aggregated ratings
accounts        – OAuth accounts (Auth.js)
sessions        – JWT sessions (Auth.js)
slots           – Date + time slot definitions
bookings        – User ↔ Slot with role assignment
interviews      – Created when slot is full; holds question + code
questions       – DSA problem bank (seeded with 8 problems)
feedback        – Post-interview text observations
ratings         – Numeric scores per interview
```

---

## 🔧 Code Execution Setup (Judge0)

1. Sign up at [rapidapi.com](https://rapidapi.com)
2. Subscribe to **Judge0 CE** (free tier: 500 req/day)
3. Copy your API key
4. Set `JUDGE0_API_KEY` in your environment

Without the key, the app runs in **mock mode** (simulates output) so everything still works for demos.

---

## 📝 Seeded DSA Questions

| # | Title | Difficulty | Topic |
|---|---|---|---|
| 1 | Two Sum | Easy | Arrays & Hashing |
| 2 | Climbing Stairs | Easy | Dynamic Programming |
| 3 | Valid Parentheses | Easy | Stack |
| 4 | Longest Substring | Medium | Sliding Window |
| 5 | Coin Change | Medium | Dynamic Programming |
| 6 | Number of Islands | Medium | Graph BFS/DFS |
| 7 | Median of Two Sorted Arrays | Hard | Binary Search |
| 8 | Merge K Sorted Lists | Hard | Linked List & Heap |

---

## 🔄 Core User Flow

```
Sign Up → Book Slot → Wait for Match → Enter Interview Room
    → Code Together → End Session → Submit Feedback → Dashboard
```

---

## ⚡ Edge Cases Handled

| Case | Handling |
|---|---|
| Slot expires before booking | Time validation on server; `EXPIRED` status in UI |
| Slot full (race condition) | DB-level unique constraint + count check |
| Double booking same day | `@@unique([userId, slotId])` constraint |
| Feedback not submitted | `pendingFeedback` flag blocks new bookings |
| No match yet | Dashboard shows "Waiting for Match" state |
| Interview not started | Auto-starts when both users enter room |
| Code execution fails | Graceful error display in console panel |

---

## 🎨 Design System

Based on the **"Focused Architect"** design philosophy:

- **Colors**: Deep architectural grays (`#0b1326` base) with electric indigo (`#c0c1ff`) accents
- **Typography**: Manrope (headlines) + Inter (body)
- **No borders**: Boundaries defined through tonal background shifts
- **Glassmorphism**: Used for floating elements with `backdrop-blur`
- **8px grid**: Consistent spacing throughout
