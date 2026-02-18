# Recipe Management System

A web-based recipe management platform with AI-powered features for organizing, discovering, and sharing recipes. Built with Next.js, PostgreSQL, and OpenAI.

## Features

- **Recipe Management** — Create, read, update, and delete recipes with images, ingredients, and step-by-step instructions
- **Status Tagging** — Tag recipes as Favorite, To Try, or Made Before
- **Search & Discovery** — Search by name, ingredient, cuisine type, or prep time
- **AI Recipe Generation** — Generate new recipes from a text prompt using GPT-4o-mini
- **AI Ingredient Substitution** — Get smart ingredient alternatives
- **AI Nutrition Estimation** — Estimate nutritional information for any recipe
- **Sharing** — Three-tier visibility (private, shared, public) with share-by-username and share-by-link
- **Social** — Rate and comment on public recipes

## Tech Stack

| Layer          | Technology                                    |
| -------------- | --------------------------------------------- |
| Framework      | Next.js 14+ (App Router)                      |
| UI             | shadcn/ui + Tailwind CSS                      |
| Database       | PostgreSQL (Neon) + Prisma ORM                |
| Authentication | NextAuth.js v5 (Google + GitHub OAuth)        |
| AI             | OpenAI GPT-4o-mini + DALL-E 3 (Vercel AI SDK) |
| Images         | Cloudinary                                    |
| Deployment     | Vercel                                        |

## Prerequisites

- [Node.js](https://nodejs.org/) 18.17 or later
- npm (included with Node.js)
- A [Neon](https://neon.tech/) PostgreSQL database
- [Google OAuth](https://console.cloud.google.com/) app credentials
- [GitHub OAuth](https://github.com/settings/developers) app credentials
- An [OpenAI](https://platform.openai.com/) API key
- A [Cloudinary](https://cloudinary.com/) account

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd recipe-management-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Open `.env.local` and fill in the values. See [Environment Variables](#environment-variables) below for details.

4. **Set up the database** _(available after Phase 2)_

   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open the app**

   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script       | Command                | Description                  |
| ------------ | ---------------------- | ---------------------------- |
| Dev server   | `npm run dev`          | Start the development server |
| Build        | `npm run build`        | Build for production         |
| Start        | `npm run start`        | Start the production server  |
| Lint         | `npm run lint`         | Run ESLint                   |
| Format       | `npm run format`       | Format code with Prettier    |
| Format check | `npm run format:check` | Check code formatting        |

### Database Scripts _(coming in Phase 2)_

| Script      | Command              | Description                        |
| ----------- | -------------------- | ---------------------------------- |
| Push schema | `npm run db:push`    | Push Prisma schema to the database |
| Migrate     | `npm run db:migrate` | Run database migrations            |
| Seed        | `npm run db:seed`    | Seed the database with sample data |
| Studio      | `npm run db:studio`  | Open Prisma Studio                 |
| Reset       | `npm run db:reset`   | Reset the database                 |

## Project Structure

```
src/
├── app/                  # Pages and API routes (App Router)
│   ├── (auth)/           # Authentication pages
│   ├── (main)/           # Authenticated app pages
│   └── api/              # API route handlers
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── layout/           # Header, navigation, footer
│   ├── recipes/          # Recipe-specific components
│   ├── search/           # Search bar, filters
│   ├── social/           # Ratings, comments, sharing
│   ├── ai/               # AI feature components
│   └── shared/           # Reusable cross-cutting components
├── hooks/                # Custom React hooks
├── lib/                  # Utility modules
├── types/                # TypeScript type definitions
└── providers/            # React context providers
```

## Environment Variables

Copy `.env.example` to `.env.local` and provide values for each variable:

| Variable                            | Description                                      |
| ----------------------------------- | ------------------------------------------------ |
| `DATABASE_URL`                      | Neon PostgreSQL connection string                |
| `NEXTAUTH_SECRET`                   | Random secret for NextAuth.js session encryption |
| `NEXTAUTH_URL`                      | App URL (default: `http://localhost:3000`)       |
| `GOOGLE_CLIENT_ID`                  | Google OAuth app client ID                       |
| `GOOGLE_CLIENT_SECRET`              | Google OAuth app client secret                   |
| `GITHUB_CLIENT_ID`                  | GitHub OAuth app client ID                       |
| `GITHUB_CLIENT_SECRET`              | GitHub OAuth app client secret                   |
| `OPENAI_API_KEY`                    | OpenAI API key for GPT-4o-mini and DALL-E 3      |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (public)                   |
| `CLOUDINARY_API_KEY`                | Cloudinary API key                               |
| `CLOUDINARY_API_SECRET`             | Cloudinary API secret                            |

## Deployment

Deployed on Vercel. Deployment instructions will be added in Phase 15.

## License

MIT
