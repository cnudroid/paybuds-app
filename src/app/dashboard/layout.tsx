import { notFound } from "next/navigation";

import { dashboardConfig } from "../../config/dashboard";
import { getCurrentUser } from "../../lib/session";
import { MainNav } from "../../components/main-nav";
import UserAccountNav from "../../components/user-account-nav";
import { ClientOnly } from "../../components/client-only";
import { Toaster } from "../../components/ui/sonner";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    // In production, enforce authentication. In development, the mock user will be used.
    if (process.env.NODE_ENV === "production") {
      return notFound();
    }
  }

  // This check is for type safety and to prevent rendering if the user is somehow still null in dev.
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col space-y-6">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav items={dashboardConfig.mainNav} />
          <ClientOnly>
            <UserAccountNav user={user} />
          </ClientOnly>
        </div>
      </header>
      <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex">
          {/* <DashboardNav items={dashboardConfig.sidebarNav} /> */}
        </aside>
        <main className="flex w-full flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
