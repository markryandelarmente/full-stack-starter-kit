import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@repo/ui/components/button';
import { useSession } from '@/lib/auth';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Fullstack App Template</h1>
      <p className="mt-6 max-w-2xl text-center text-lg text-muted-foreground">
        A modern fullstack starter template built with React, Express, Prisma, and Better Auth.
        Production-ready with TypeScript, Tailwind CSS, and Shadcn UI.
      </p>
      <div className="mt-10 flex items-center gap-4">
        {session?.user ? (
          <Button asChild size="lg">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        ) : (
          <>
            <Button asChild size="lg">
              <Link to="/sign-up">Get Started</Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link to="/sign-in">Sign In</Link>
            </Button>
          </>
        )}
      </div>

      <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          title="Type-Safe"
          description="End-to-end TypeScript with shared types between frontend and backend."
        />
        <FeatureCard
          title="Authentication"
          description="Built-in auth with Better Auth - email/password and social providers."
        />
        <FeatureCard
          title="Database"
          description="Prisma ORM with PostgreSQL for type-safe database access."
        />
        <FeatureCard
          title="Modern Stack"
          description="React 19, Vite, Express 5, and Tailwind CSS for fast development."
        />
        <FeatureCard
          title="Monorepo"
          description="Turborepo-powered monorepo with shared packages and configs."
        />
        <FeatureCard
          title="Production Ready"
          description="ESLint, Prettier, and best practices baked in from the start."
        />
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
