# Recipe Management System - CTO Specs

> **Status:** SEED — These specs will be refined after PM questions are answered.

---

## Architecture Overview

### Approach: Full-Stack Monorepo
Same architectural philosophy as the Library project for consistency and speed.

```
RecipeManagementSystem/
├── frontend/          # React/Next.js SPA
├── backend/           # Node.js API server
├── database/          # Migration scripts & seed data
├── docs/              # Spec files (this folder)
└── README.md
```

---

## Technology Stack (Seed Recommendations)

> **These are starting positions. Final decisions depend on PM answers.**
> **Recommendation: Use the same stack as the Library project for consistency.**

### Frontend
| Choice | Technology | Rationale |
|--------|-----------|-----------|
| Framework | **Next.js 14+ (App Router)** | Same as Library project, consistent DX |
| UI Library | **shadcn/ui + Tailwind CSS** | Recipe cards look great with this stack |
| State Management | **React Query (TanStack Query)** | Consistent with Library project |
| Forms | **React Hook Form + Zod** | Complex recipe forms benefit from this |

### Backend
| Choice | Technology | Rationale |
|--------|-----------|-----------|
| Runtime | **Node.js** | Consistent with Library project |
| Framework | **Next.js API Routes** | Unified deployment |
| ORM | **Prisma** | Handles recipe-ingredient relationships well |
| Validation | **Zod** | Shared schemas |

### Database
| Choice | Technology | Rationale |
|--------|-----------|-----------|
| Primary DB | **PostgreSQL** | Relational model suits recipes (many-to-many with ingredients) |
| Hosting | **Supabase / Neon / Railway Postgres** | Free tier, managed |

### Authentication
| Choice | Technology | Rationale |
|--------|-----------|-----------|
| Auth Provider | **NextAuth.js (Auth.js)** or **Clerk** | User accounts with profiles |
| SSO Providers | Google OAuth + GitHub OAuth | Quick setup, good UX |

### AI Integration
| Choice | Technology | Rationale |
|--------|-----------|-----------|
| AI Provider | **OpenAI API (GPT-4)** or **Anthropic Claude API** | Recipe generation, ingredient substitution, NL queries |
| Use Cases | Chat completions (primary), embeddings (optional) | Most recipe AI features work with prompt engineering |

### Deployment
| Choice | Technology | Rationale |
|--------|-----------|-----------|
| Platform | **Vercel** or **Railway** | Consistent with Library project |
| CI/CD | **GitHub Actions** or platform auto-deploy | Auto-deploy on push |

---

## Key Architecture Decisions

### Decision 1: Same Stack as Library Project
**Recommendation: Yes, mirror the Library project stack**
- Faster development — reuse patterns and boilerplate
- Demonstrates consistency in approach
- Shared knowledge between projects reduces context-switching

### Decision 2: Recipe Data Model
**Recommendation: Normalized relational model**
- Recipes have a many-to-many relationship with ingredients
- This enables "search by ingredient" and "what can I make with X?"
- Ingredients table allows AI to work with structured data, not just text blobs

```
Recipe ──┬──► RecipeIngredient ──► Ingredient
         ├──► RecipeStep (ordered instructions)
         ├──► RecipeTag (status: favorite/to-try/made-before)
         └──► RecipeShare (sharing permissions)
```

### Decision 3: AI Integration Pattern
**Recommendation: Server-side API routes with streaming**
- Recipe generation can produce long outputs — streaming improves UX
- Ingredient substitution is a quick request-response
- Nutritional estimates can be cached per recipe
- "What can I make?" queries use the user's recipe collection as context

### Decision 4: Sharing Architecture
**Recommendation: Visibility flag + share links**
- Each recipe has a `visibility` field: `private` | `public`
- Public recipes are browsable by all authenticated users
- Optional: share via link for unauthenticated viewing
- No complex friend/follow system (overkill for this assessment)

### Decision 5: Image Strategy
**Recommendation: URL-based with optional Cloudinary upload**
- Start with URL-based images (simpler)
- Can add Cloudinary/S3 upload as an enhancement
- AI-generated placeholder images as a creative feature?

---

## Infrastructure Diagram (Simplified)

```
[User Browser]
      │
      ▼
[Next.js Frontend (Vercel)]
      │
      ▼
[Next.js API Routes]
      │
      ├──► [PostgreSQL (Supabase/Neon)]
      ├──► [OpenAI / Claude API]
      └──► [OAuth Providers]
```

---

## Security Considerations

- API keys as environment variables only
- Recipe ownership enforced at API level (users can only edit their own)
- Rate limiting on AI endpoints
- Input sanitization (recipe names, ingredients — user-generated content)
- Sharing permissions validated server-side

---

## Data Model Considerations Unique to Recipes

Unlike the Library project (simple book entity), the Recipe project has more complex data relationships:

- **Ingredients** should be a separate entity for searchability
- **Instructions** should be ordered steps (not a single text blob) for better UX
- **Nutritional data** can be stored as JSON or separate table
- **Tags** are per-user-per-recipe (my "favorite" isn't your "favorite")

---

## Open Dependencies (Awaiting PM Decisions)

| PM Question | Impact on CTO Decision |
|------------|----------------------|
| Sharing model (private vs public default) | Affects visibility system and query patterns |
| Social features (comments/ratings) | Adds tables and API complexity |
| Which AI features | Determines API design and cost structure |
| Image approach | May need file storage service |
| Same tech stack as Library? | Affects all technology choices |
| Recipe import from URL | Needs web scraping / AI extraction pipeline |
