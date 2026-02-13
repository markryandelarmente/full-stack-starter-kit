import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '@repo/ui/components/toaster';
import { authClient } from '@/lib/auth';

export const Route = createRootRoute({
  context: () => ({
    auth: authClient,
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}
