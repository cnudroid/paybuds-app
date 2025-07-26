import { getCurrentUser } from "../../../../lib/session";
import { db } from "../../../../lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "../../../../components/ui/button";
import { calculateGroupBalances } from "../../../../lib/balances";
import { AddMemberForm } from "../../../../components/add-member-form";
import { GroupMembersList } from "../../../../components/group-members-list";
import { LeaveGroupButton } from "../../../../components/leave-group-button";
import { ClientOnly } from "../../../../components/client-only";
import { AddSettlementForm } from "../../../../components/add-settlement-form";
import { SettlementsList } from "../../../../components/settlements-list";
import { ExpensesList } from '../../../../components/expenses-list';
import { Prisma } from '@prisma/client';

// ...existing code...

const groupWithDetails = Prisma.validator<Prisma.GroupDefaultArgs>()({
  include: {
    members: { include: { user: true } },
    expenses: {
      include: {
        payer: true,
        splits: { include: { user: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    },
    settlements: {
      include: {
        payer: true,
        receiver: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    },
  },
});

type GroupWithDetails = Prisma.GroupGetPayload<typeof groupWithDetails>;

async function getGroup(groupId: string, userId: string): Promise<GroupWithDetails> {
  const group = await db.group.findFirst({
    where: {
      id: groupId,
      members: {
        some: {
          userId: userId,
        },
      },
    },
    ...groupWithDetails,
  });

  if (!group) {
    notFound();
  }

  return group;
}

export default async function GroupPage({ params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const user = await getCurrentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const group = await getGroup(groupId, user.id);
  const balances = calculateGroupBalances(group.members, group.expenses, group.settlements);
  const userBalance = balances.find((b) => b.userId === user.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/groups/${group.id}/expenses/new`}
            className={buttonVariants({ variant: "default" })}
          >
            Add Expense
          </Link>
          <Link
            href={`/dashboard/groups/${group.id}/settings`}
            className={buttonVariants({ variant: "outline" })}
          >
            Settings
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Balances</h2>
          <ul className="space-y-2">
            {balances.map((balance) => (
              <li key={balance.userId} className="flex justify-between items-center p-3 border rounded-lg">
                <span>{balance.userName}</span>
                <span className={`${balance.balance >= 0 ? 'text-green-600' : 'text-red-600'} font-semibold`}>
                  {balance.balance >= 0 ? `gets back $${balance.balance.toFixed(2)}` : `owes $${(-balance.balance).toFixed(2)}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Members</h2>
          <GroupMembersList group={group} currentUser={user} />
          <AddMemberForm groupId={group.id} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Record a Settlement</h2>
          <AddSettlementForm groupId={group.id} members={group.members.map(m => m.user)} currentUserId={user.id} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Settlements</h2>
          <SettlementsList settlements={group.settlements} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Expenses</h2>
        <ExpensesList expenses={group.expenses} groupMembers={group.members} />
      </div>

      <div className="mt-8 pt-8 border-t">
        <ClientOnly>
          <LeaveGroupButton groupId={group.id} userBalance={userBalance} />
        </ClientOnly>
      </div>
    </div>
  );
}
