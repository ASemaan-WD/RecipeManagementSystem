# Test File Skill

> This skill defines the canonical pattern for creating test files, test factories, test setup, and MSW mock handlers. All tests use Vitest + Testing Library + MSW and follow a consistent structure for mocking, assertions, and data generation.

---

## Entity Types Covered

1. **Test files** — `__tests__/*.test.ts(x)` co-located with source
2. **Test factories** — `src/test/factories.ts` for mock data generation
3. **Test setup** — `src/test/setup.ts` for global test configuration
4. **MSW mock handlers** — `src/mocks/handlers.ts` for API mocking

---

## File Naming & Location

| Type                  | Naming                     | Location                                         |
| --------------------- | -------------------------- | ------------------------------------------------ |
| Unit/integration test | `<source-name>.test.ts(x)` | `src/<path>/__tests__/` (co-located with source) |
| Test factories        | `factories.ts`             | `src/test/`                                      |
| Test setup            | `setup.ts`                 | `src/test/`                                      |
| MSW handlers          | `handlers.ts`              | `src/mocks/`                                     |

### Test File Location Examples

```
src/app/api/auth/username/
├── route.ts
└── __tests__/
    └── route.test.ts          # API route test

src/components/layout/
├── header.tsx
├── footer.tsx
└── __tests__/
    ├── header.test.tsx        # Component test
    └── footer.test.tsx        # Component test

src/lib/
├── auth-utils.ts
└── __tests__/
    └── auth-utils.test.ts     # Utility test
```

- Use `.test.tsx` for tests that render React components.
- Use `.test.ts` for tests that test pure logic or API routes.

---

## Import Ordering (Mandatory)

```typescript
// 1. Vitest imports
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 2. Testing library imports (for component tests)
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// 3. Next.js / framework imports needed for test
import { NextRequest, NextResponse } from 'next/server';

// 4. Module under test
import { GET, POST } from '@/app/api/auth/username/route';

// 5. Dependencies that will be mocked
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';

// 6. Test utilities
import { createMockSession, createMockRecipe } from '@/test/factories';
```

---

## Complete Templates

### API Route Test

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/auth/username/route';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { createMockSession } from '@/test/factories';

// ─── Hoisted Mock Classes (for Prisma errors) ───
const { MockPrismaClientKnownRequestError } = vi.hoisted(() => {
  class MockPrismaClientKnownRequestError extends Error {
    code: string;
    constructor(
      message: string,
      meta: { code: string; clientVersion?: string }
    ) {
      super(message);
      this.name = 'PrismaClientKnownRequestError';
      this.code = meta.code;
    }
  }
  return { MockPrismaClientKnownRequestError };
});

// ─── Module Mocks ───
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/generated/prisma/client', () => ({
  Prisma: {
    PrismaClientKnownRequestError: MockPrismaClientKnownRequestError,
  },
}));

// ─── Typed Mock References ───
const mockUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockUserUpdate = vi.mocked(prisma.user.update);
const mockRequireAuth = vi.mocked(requireAuth);

// ─── Global Setup ───
beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Test Suites ───
describe('GET /api/auth/username', () => {
  it('returns 400 when username param is missing', async () => {
    const req = new NextRequest('http://localhost/api/auth/username');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Username query parameter is required');
  });

  it('returns { available: true } when username is not taken', async () => {
    mockUserFindUnique.mockResolvedValueOnce(null);
    const req = new NextRequest(
      'http://localhost/api/auth/username?username=newuser'
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(true);
  });
});

describe('POST /api/auth/username', () => {
  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
    const req = new NextRequest('http://localhost/api/auth/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns success with username on valid submission', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession({ id: 'user-1' }));
    mockUserFindUnique.mockResolvedValueOnce({ username: null } as never);
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockUserUpdate.mockResolvedValueOnce({ username: 'newuser' } as never);

    const req = new NextRequest('http://localhost/api/auth/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newuser' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.username).toBe('newuser');
  });
});
```

### Component Test

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '@/components/path/component-name';

// ─── Module Mocks ───
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
  signOut: vi.fn(),
}));

// ─── Global Setup ───
beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Test Suite ───
describe('ComponentName', () => {
  it('renders the component', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<ComponentName />);

    await user.click(screen.getByRole('button', { name: 'Action' }));
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
```

### Test Factory File

```typescript
import type { Session } from 'next-auth';

// ─── Type Definitions ───

export interface MockUser {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Factory Functions ───

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    image: 'https://example.com/avatar.jpg',
    emailVerified: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function createMockSession(
  overrides: Partial<Session['user']> = {}
): Session {
  return {
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
      username: 'testuser',
      ...overrides,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function createMockRecipe(overrides: Record<string, unknown> = {}) {
  return {
    id: 'recipe-1',
    name: 'Test Recipe',
    description: 'A test recipe',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: 'EASY' as const,
    cuisineType: 'Italian',
    visibility: 'PRIVATE' as const,
    nutritionData: null,
    avgRating: null,
    ratingCount: 0,
    authorId: 'user-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}
```

**Key rules:**

- Every factory function accepts `overrides` parameter for customization.
- Default values should be realistic but deterministic (fixed dates, predictable IDs).
- Export the interface alongside the factory.
- Name as `createMock<Entity>`.

### Test Setup File

```typescript
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, afterAll, beforeAll } from 'vitest';
import { server } from '@/mocks/handlers';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => server.close());
```

### MSW Mock Handlers

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  http.get('/api/auth/username', ({ request }) => {
    const url = new URL(request.url);
    const username = url.searchParams.get('username');

    if (!username) {
      return HttpResponse.json(
        { error: 'Username query parameter is required' },
        { status: 400 }
      );
    }

    return HttpResponse.json({ available: true });
  }),

  http.post('/api/auth/username', async ({ request }) => {
    const body = (await request.json()) as { username?: string };

    if (!body.username) {
      return HttpResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    return HttpResponse.json({ username: body.username });
  }),
];

export const server = setupServer(...handlers);
```

**Key rules:**

- Handlers mirror the actual API route behavior (happy path by default).
- Export both `handlers` array and `server` instance.
- Use `HttpResponse.json()` for responses.
- Type request bodies with `as` assertion.

---

## Pattern Details

### Mocking Strategy

1. **Module mocks** at file level with `vi.mock()` — mock entire modules.
2. **Hoisted mocks** with `vi.hoisted()` — for classes needed inside `vi.mock()` (e.g., Prisma errors).
3. **Typed mock references** with `vi.mocked()` — create typed handles after mocking.
4. **Per-test overrides** with `mockResolvedValueOnce` / `mockReturnValueOnce`.

```typescript
// Module mock
vi.mock('@/lib/db', () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));

// Typed reference
const mockFindUnique = vi.mocked(prisma.user.findUnique);

// Per-test setup
mockFindUnique.mockResolvedValueOnce(null);
```

### Cleanup

- Always `beforeEach(() => vi.clearAllMocks())` — reset all mock state between tests.
- For component tests, `cleanup()` is handled by `src/test/setup.ts`.

### NextRequest Construction

```typescript
// GET with query params
const req = new NextRequest('http://localhost/api/path?key=value');

// POST with JSON body
const req = new NextRequest('http://localhost/api/path', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ field: 'value' }),
});
```

### Assertion Patterns

```typescript
// Status code
expect(res.status).toBe(200);

// JSON body
const body = await res.json();
expect(body.field).toBe('value');
expect(body.error).toContain('partial message');

// DOM assertions (component tests)
expect(screen.getByText('Text')).toBeInTheDocument();
expect(screen.getByRole('button', { name: 'Label' })).toBeEnabled();

// Thrown errors
await expect(POST(req)).rejects.toThrow('Error message');

// Mock calls
expect(mockFn).toHaveBeenCalledWith({ expected: 'args' });
expect(mockFn).toHaveBeenCalledTimes(1);
```

---

## Proof of Pattern

| File                                                | Pattern Demonstrated                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| `src/app/api/auth/username/__tests__/route.test.ts` | Full API route test with hoisted mocks, Prisma error testing, auth mocking |
| `src/components/layout/__tests__/footer.test.tsx`   | Component rendering test                                                   |
| `src/test/factories.ts`                             | Mock data factories with overrides pattern                                 |
| `src/test/setup.ts`                                 | Global test setup with MSW                                                 |
| `src/mocks/handlers.ts`                             | MSW handler definitions                                                    |

---

## Anti-Patterns

- **Never** use `test()` — always use `it()` for consistency.
- **Never** skip `beforeEach(() => vi.clearAllMocks())` — stale mocks cause flaky tests.
- **Never** mock what you don't need — only mock external dependencies.
- **Never** test implementation details — test behavior and output.
- **Never** use `as any` for mock return values — use `as never` if type coercion is needed.
- **Never** put test files outside `__tests__/` directories — always co-locate.
- **Never** create mock data inline in tests — use factories from `src/test/factories.ts`.
- **Never** duplicate factory logic — add a new factory function for new entity types.

---

## Checklist

Before committing a new test:

- [ ] File is in `__tests__/` co-located with source, named `<source>.test.ts(x)`
- [ ] Import order: vitest → testing-library → framework → module under test → mocked deps → factories
- [ ] All external dependencies are mocked with `vi.mock()`
- [ ] `beforeEach(() => vi.clearAllMocks())` is present
- [ ] Mock references use `vi.mocked()` for type safety
- [ ] Tests use `it()` (not `test()`)
- [ ] Tests are grouped in `describe()` blocks by HTTP method or feature
- [ ] Assertions check both status codes and response bodies
- [ ] Mock data comes from factories (not inline)
- [ ] Error paths are tested (validation, auth, not found, conflicts)
