import { createFileRoute } from '@tanstack/react-router';
import { useSession } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { useCurrentUser, useUsers } from '@/hooks/api/users/users-queries';

export const Route = createFileRoute('/(app)/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: session } = useSession();

  // Fetch current user with TanStack Query (demonstrates caching & background refetch)
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();

  // Fetch users list with pagination (demonstrates paginated queries)
  const { data: usersData, isLoading: isLoadingUsers, error: usersError } = useUsers({ page: 1, pageSize: 5 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name ?? session?.user?.email}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUser ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 rounded-full animate-spin border-primary border-t-transparent" />
              </div>
            ) : (
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{currentUser?.email ?? session?.user?.email}</dd>
                </div>
                {(currentUser?.name ?? session?.user?.name) && (
                  <div>
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium">{currentUser?.name ?? session?.user?.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Email Verified</dt>
                  <dd className="font-medium">
                    {(currentUser?.emailVerified ?? session?.user?.emailVerified) ? 'Yes' : 'No'}
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>
              {usersError ? `${usersError.message}` : usersData ? `${usersData.total} total users` : 'Loading...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {
            usersError ? (
              <div className="flex items-center justify-center py-4">
                <p className="text-sm text-muted-foreground">{usersError.message}</p>
              </div>
            ) :
            isLoadingUsers ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 rounded-full animate-spin border-primary border-t-transparent" />
              </div>
            ) : usersData?.items.length ? (
              <ul className="space-y-3">
                {usersData.items.map((user) => (
                  <li key={user.id} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.image ?? undefined} alt={user.name ?? user.email} />
                      <AvatarFallback>
                        {(user.name ?? user.email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name ?? 'No name'}</p>
                      <p className="text-xs truncate text-muted-foreground">{user.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No users found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Build your application</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="pl-4 space-y-1 list-disc">
              <li>
                Add new pages in <code>apps/web/src/routes</code>
              </li>
              <li>
                Create API routes in <code>apps/api/src/routes</code>
              </li>
              <li>
                Use hooks from <code>@/hooks</code> for data fetching
              </li>
              <li>
                Add shared types in <code>packages/shared</code>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Resources</CardTitle>
            <CardDescription>Learn more about the technologies used</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <li>
                <a
                  href="https://tanstack.com/query/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  TanStack Query Docs
                </a>
              </li>
              <li>
                <a
                  href="https://react.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  React Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://www.better-auth.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Better Auth Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://www.prisma.io/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Prisma Documentation
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
