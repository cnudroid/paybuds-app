import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import { AddExpenseModal } from "@/components/add-expense-modal";
import { DashboardSummary } from '@/components/dashboard-summary';
import { Suspense } from 'react';

export default async function DashboardPage() {
  console.log('Dashboard: NODE_ENV =', process.env.NODE_ENV);
  
  const user = await getCurrentUser();
  console.log('Dashboard: user =', user ? 'found' : 'not found');

  if (!user) {
    console.log('Dashboard: No user found, redirecting to signin');
    // In production, this will redirect. In development, this check ensures the component
    // doesn't proceed to render with an undefined user, although `getCurrentUser` should prevent this.
    if (process.env.NODE_ENV === "production") {
      redirect(authOptions?.pages?.signIn || "/login");
    }
    // If in development and somehow user is still null, return null to prevent crash.
    return null;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <AddExpenseModal />
          <Link href="/dashboard/groups/new">
            <Button>Create Group</Button>
          </Link>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <Suspense fallback={<div>Loading summary...</div>}>
          <DashboardSummary />
        </Suspense>
        {/* You could add other components like a simplified activity feed here */}
      </div>
    </div>
  );
}
