import type { ReactNode } from "react";
import { TopNav } from "./top-nav";

/** App chrome: sticky top nav + a centered, max-width content column. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
