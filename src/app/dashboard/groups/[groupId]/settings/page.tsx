import { getCurrentUser } from "../../../../../lib/session";
import { db } from "../../../../../lib/db";
import { notFound } from "next/navigation";
import { EditGroupNameForm } from "../../../../../components/edit-group-name-form";
import { calculateGroupBalances } from "../../../../../lib/balances";
import { DeleteGroupButton } from "../../../../../components/delete-group-button";

interface GroupSettingsPageProps {
  params: {
    groupId: string;
  };
}

async function getGroup(groupId: string, userId: string) {
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
      members: { include: { user: true } },
      expenses: { include: { splits: true } },
      settlements: true,
    },
  });

  if (!group) {
    notFound();
  }

  return group;
}

export default async function GroupSettingsPage({ params }: GroupSettingsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const group = await getGroup(params.groupId, user.id);
  const balances = calculateGroupBalances(group.members, group.expenses, group.settlements);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Group Settings</h1>
      <div className="max-w-md space-y-8">
        <EditGroupNameForm group={group} />

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This action is permanent and cannot be undone.
          </p>
          <DeleteGroupButton groupId={group.id} balances={balances} />
        </div>
      </div>
    </div>
  );
}
