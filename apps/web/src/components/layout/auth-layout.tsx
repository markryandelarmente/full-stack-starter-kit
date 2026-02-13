import { Link, Outlet } from '@tanstack/react-router';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50">
      <div className="mb-8">
        <Link to="/" className="text-2xl font-bold">
          Fullstack App
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
