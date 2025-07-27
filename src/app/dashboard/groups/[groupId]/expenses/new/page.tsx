import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AddExpenseForm } from "@/components/add-expense-form";
import { db } from "@/lib/db";

interface AddExpensePageProps {
  params: Promise<{ groupId: string }>;
}

export default async function AddExpensePage({ params }: AddExpensePageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }

  const resolvedParams = await params;
  const { groupId } = resolvedParams;

  // Get the group with members
  const group = await db.group.findFirst({
    where: {
      id: groupId,
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!group) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Expense</h1>
        <p className="text-muted-foreground">In group: {group.name}</p>
      </div>
      <AddExpenseForm group={group} currentUser={user} />
    </div>
  );
}
