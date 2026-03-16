import { Outlet } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import ToggleTheme from "@/layouts/components/ToggleTheme";

export default function FocusedLayout() {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-end px-4 py-3 md:px-6">
          <ToggleTheme />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-6">
        <ErrorBoundary>
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </ErrorBoundary>
      </main>
    </div>
  );
}
