import { Outlet } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute -left-24 top-12 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-accent/40 blur-3xl" />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}
