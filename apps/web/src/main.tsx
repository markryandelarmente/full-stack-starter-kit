import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { routeTree } from './routeTree.gen';
import { authClient } from './lib/auth';
import { ErrorBoundary } from './components/common/error-boundary';
import './index.css';
import { validateClientEnv } from '../env';

// Validate client environment variables
try {
  validateClientEnv(import.meta.env);
} catch (error) {
  console.error('Failed to validate environment variables:', error);
  // In development, show a helpful error message
  if (import.meta.env.DEV) {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui;">
        <div style="text-align: center; padding: 2rem; max-width: 600px;">
          <h1 style="color: #ef4444; margin-bottom: 1rem;">Environment Variable Error</h1>
          <p style="color: #6b7280; margin-bottom: 1rem;">${error instanceof Error ? error.message : 'Invalid environment variables'}</p>
          <p style="color: #6b7280; font-size: 0.875rem;">Please check your .env file and ensure VITE_API_URL is set correctly.</p>
        </div>
      </div>
    `;
    throw error;
  }
  // In production, still throw to prevent app from running with invalid config
  throw error;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    auth: authClient,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }

  interface RouterContext {
    auth: typeof authClient;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
