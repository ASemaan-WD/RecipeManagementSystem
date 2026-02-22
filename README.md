# Recipe Management System — AI-Enhanced Recipe Platform

A full-stack recipe management platform for organizing, discovering, and sharing recipes with AI-powered features. Built with Next.js, TypeScript, and OpenAI GPT-4o-mini.

## Live App

**[recipe-management-system-mu.vercel.app](https://recipe-management-system-mu.vercel.app/)**

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![NextAuth](https://img.shields.io/badge/NextAuth-v5-7C3AED)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)

| Layer         | Technology                                    |
| ------------- | --------------------------------------------- |
| Framework     | Next.js 16 (App Router)                       |
| Language      | TypeScript (strict mode)                      |
| Database      | PostgreSQL via Neon                           |
| ORM           | Prisma 7 with `@prisma/adapter-neon`          |
| Auth          | NextAuth.js v5 — Google & GitHub OAuth        |
| AI            | OpenAI GPT-4o-mini + DALL-E 3 (Vercel AI SDK) |
| UI            | shadcn/ui, Tailwind CSS 4                     |
| Data Fetching | TanStack React Query                          |
| Image Storage | Vercel Blob                                   |
| Testing       | Vitest (unit) + Playwright (E2E)              |

## Features

- Recipe CRUD with multi-step form wizard, image uploads, and detailed ingredients/instructions
- Full-text search with filters for cuisine, difficulty, prep time, and dietary tags
- Star ratings, comments, and three-tier visibility (private/shared/public)
- Collections — tag recipes as Favorite, To Try, or Made Before; save and browse by tab
- AI recipe generation from ingredients (GPT-4o-mini)
- AI ingredient substitution suggestions and nutritional estimates
- AI image generation for recipes (DALL-E 3)
- Recipe scaling and unit conversion
- Step-by-step cooking mode with timers
- Shopping list generation
- Share recipes by username or link
- Dark mode with system preference detection
- Fully responsive design (mobile, tablet, desktop)
- Print-friendly recipe view

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- A **[Neon](https://neon.tech/)** PostgreSQL database
- **Google** OAuth credentials — [create here](https://console.cloud.google.com/apis/credentials)
- **GitHub** OAuth credentials — [create here](https://github.com/settings/developers)
- **OpenAI** API key — [get one here](https://platform.openai.com/api-keys)
- A **[Vercel](https://vercel.com/)** account (for Blob storage token)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/ASemaan-WD/RecipeManagementSystem.git
cd RecipeManagementSystem

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Fill in all values in .env.local (see table below)

# 4. Run database migrations
npm run db:migrate

# 5. Seed the database with sample data
npm run db:seed

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable                | Required | Description                                                  |
| ----------------------- | -------- | ------------------------------------------------------------ |
| `DATABASE_URL`          | Yes      | Neon PostgreSQL connection string                            |
| `NEXTAUTH_URL`          | Yes      | App URL (`http://localhost:3000` for dev)                    |
| `NEXTAUTH_SECRET`       | Yes      | JWT signing secret — generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID`      | Yes      | Google OAuth client ID                                       |
| `GOOGLE_CLIENT_SECRET`  | Yes      | Google OAuth client secret                                   |
| `GITHUB_CLIENT_ID`      | Yes      | GitHub OAuth client ID                                       |
| `GITHUB_CLIENT_SECRET`  | Yes      | GitHub OAuth client secret                                   |
| `OPENAI_API_KEY`        | Yes      | OpenAI API key (GPT-4o-mini + DALL-E 3)                      |
| `BLOB_READ_WRITE_TOKEN` | Yes      | Vercel Blob storage token                                    |

## Scripts

| Command            | Description                |
| ------------------ | -------------------------- |
| `npm run dev`      | Start development server   |
| `npm run build`    | Production build           |
| `npm start`        | Start production server    |
| `npm run lint`     | Run ESLint                 |
| `npm run format`   | Format with Prettier       |
| `npm run test`     | Run unit tests (Vitest)    |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run analyze`  | Bundle size analysis       |
