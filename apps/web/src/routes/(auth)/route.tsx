import { AuthLayout } from '@/components/layout/auth-layout';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(auth)')({
  component: AuthLayout,
});
