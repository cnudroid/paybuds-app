import { getCurrentUser } from "../../../../../lib/session";
import { db } from "../../../../../lib/db";
import { calculateGroupBalances } from "../../../../../lib/balances";

export async function DELETE(
  req: Request,
  context: unknown
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { groupId } = (context as { params: { groupId: string } }).params;
    const group = await db.group.findFirst({
      where: {
        id: groupId,
        members: { some: { userId: user.id } },
      },
      include: {
        members: { include: { user: true } },
        expenses: { include: { splits: true } },
        settlements: true,
      },
    });

    if (!group) {
      return new Response("Group not found or you are not a member.", { status: 404 });
    }

    const balances = calculateGroupBalances(group.members, group.expenses, group.settlements ?? []);
    const userBalance = balances.find((b) => b.userId === user.id);

    if (userBalance && userBalance.balance !== 0) {
      return new Response("You cannot leave the group until your balance is zero.", { status: 400 });
    }

    await db.groupMember.deleteMany({
      where: {
        groupId: groupId,
        userId: user.id,
      },
    });

    return new Response("You have left the group successfully.", { status: 200 });

  } catch (error) {
    console.error(error);
    return new Response("Something went wrong.", { status: 500 });
  }
}
