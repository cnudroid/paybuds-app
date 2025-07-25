import { getCurrentUser } from "../../../../lib/session";
import { db } from "../../../../lib/db";
import { z } from "zod";
import { calculateGroupBalances } from "../../../../lib/balances";

const updateGroupSchema = z.object({
  name: z.string().min(1, "Group name is required.").max(100),
});

export async function GET(
  req: Request
) {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const groupId = pathParts[3];
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const group = await db.group.findFirst({
      where: {
        id: groupId,
        members: { some: { userId: user.id } },
      },
      include: {
        members: { include: { user: true } },
      },
    });

    if (!group) {
      return new Response("Group not found or you are not a member.", { status: 404 });
    }

    return new Response(JSON.stringify(group), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("Something went wrong.", { status: 500 });
  }
}

export async function PATCH(
  req: Request
) {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const groupId = pathParts[3];
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const isMember = await db.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: user.id,
      },
    });

    if (!isMember) {
      return new Response("You are not a member of this group.", { status: 403 });
    }

    const json = await req.json();
    const body = updateGroupSchema.parse(json);

    await db.group.update({
      where: {
        id: groupId,
      },
      data: {
        name: body.name,
      },
    });

    return new Response("Group updated successfully.", { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 });
    }

    console.error(error);
    return new Response("Something went wrong.", { status: 500 });
  }
}

export async function DELETE(
  req: Request
) {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const groupId = pathParts[3];
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

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

    const balances = calculateGroupBalances(group.members, group.expenses, group.settlements);
    const isSettled = balances.every((b) => b.balance === 0);

    if (!isSettled) {
      return new Response("Group cannot be deleted until all balances are settled.", { status: 400 });
    }

    await db.group.delete({
      where: {
        id: groupId,
      },
    });

    return new Response("Group deleted successfully.", { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("Something went wrong.", { status: 500 });
  }
}

