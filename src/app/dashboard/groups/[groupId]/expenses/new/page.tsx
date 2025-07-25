import { getCurrentUser } from "../../../../../../lib/session";
import { db } from "../../../../../../lib/db";
import { notFound } from "next/navigation";
import { AddExpenseForm } from "@/components/add-expense-form";

interface AddExpensePageProps {
  params: {
    groupId: string;
  };
}

async function getGroupWithMembers(groupId: string, userId: string) {
  const group = await db.group.findFirst({
    where: {
      id: groupId,
      members: {
        some: {
          userId: userId,
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
    notFound();
  }

  return group;
}

export default async function AddExpensePage({ params }: AddExpensePageProps) {
  const { groupId } = params;
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const group = await getGroupWithMembers(groupId, user.id);

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
