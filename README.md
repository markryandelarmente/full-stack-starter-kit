# Smart Breeder Farm

A smart breeder farm management system built for farm owners to manage their farm operations.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Shadcn UI
- **Backend**: Express.js 5, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth
- **Monorepo**: Turborepo, pnpm workspaces

## Project Structure

```
/apps
  /web        → React frontend (Vite)
  /api        → Express.js backend

/packages
  /db         → Prisma schema + client
  /auth       → Better Auth configuration
  /shared     → Types, validators, utilities
  /config     → ESLint, TypeScript, env configs

/scripts      → Setup and utility scripts
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database

### Setup

1. **Clone and install dependencies**

```bash
git clone <repository-url>
cd fullstack-app-template
pnpm install
```

2. **Configure environment variables**

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fullstack_app"
BETTER_AUTH_SECRET="your-secret-key-min-32-chars-long"
BETTER_AUTH_URL="http://localhost:3000"
PORT=3001
VITE_API_URL="http://localhost:3001"
```

3. **Set up the database**

```bash
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
```

4. **Start development servers**

```bash
pnpm dev
```

This starts:

- Frontend at http://localhost:3000
- Backend at http://localhost:3001

## Scripts

| Command            | Description                   |
| ------------------ | ----------------------------- |
| `pnpm dev`         | Start all development servers |
| `pnpm build`       | Build all packages            |
| `pnpm lint`        | Run ESLint on all packages    |
| `pnpm typecheck`   | Type check all packages       |
| `pnpm format`      | Format code with Prettier     |
| `pnpm db:generate` | Generate Prisma client        |
| `pnpm db:push`     | Push schema to database       |
| `pnpm db:studio`   | Open Prisma Studio            |

## Packages

### `@repo/db`

Prisma schema and client for database operations.

```ts
import { prisma } from '@repo/db';

const users = await prisma.user.findMany();
```

### `@repo/auth`

Better Auth configuration for authentication.

```ts
// Server
import { auth } from '@repo/auth';

// Client
import { useSession, signIn, signOut } from '@repo/auth/client';
```

### `@repo/shared`

Shared types, validators, and utilities.

```ts
import type { User } from '@repo/shared/types';
import { signUpSchema } from '@repo/shared/validators';
import { formatDate } from '@repo/shared/utils';
```

### `@repo/config`

Shared ESLint, TypeScript, and environment configurations.

```ts
// eslint.config.js
import reactConfig from '@repo/config/eslint/react';
export default reactConfig;

// tsconfig.json
{ "extends": "@repo/config/typescript/react" }
```

## Authentication

This template uses [Better Auth](https://better-auth.com) for authentication:

- Email/password authentication
- Session management
- Protected routes

### Frontend Usage

```tsx
import { useSession, signIn, signOut } from '@repo/auth/client';

function Profile() {
  const { data: session, isPending } = useSession();

  if (isPending) return <Loading />;
  if (!session) return <Navigate to="/sign-in" />;

  return <div>Welcome, {session.user.name}</div>;
}
```

### Backend Usage

```ts
import { requireAuth } from '../middleware/auth';

router.get('/profile', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
```

## Adding New Features

### New API Route

1. Create route file in `apps/api/src/routes/`
2. Register in `apps/api/src/routes/index.ts`

### New Page/Route

1. Create route file in `apps/web/src/routes/`
2. Routes are automatically discovered by TanStack Router (file-based routing)
3. Use `createFileRoute` to define the route component

Example:

```tsx
// apps/web/src/routes/about.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

function AboutPage() {
  return <div>About Us</div>;
}
```

### New Shared Type

1. Define in `packages/shared/src/types/`
2. Export from `packages/shared/src/types/index.ts`

### New Database Model

1. Add to `packages/db/prisma/schema.prisma`
2. Run `pnpm db:generate` and `pnpm db:push`

## License

MIT
