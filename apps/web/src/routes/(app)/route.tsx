import { createFileRoute, redirect } from '@tanstack/react-router';
import { Layout } from '@/components/layout/layout';
import type { authClient } from '@repo/auth';

export const Route = createFileRoute('/(app)')({
  beforeLoad: async ({
    context,
    location,
  }: {
    context: { auth: typeof authClient };
    location: { href: string };
  }) => {
    // Check authentication - protects all child routes
    const result = await context.auth.getSession();
    if (result.error || !result.data?.user) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: Layout,
});
