import { getCurrentUser } from "../../../../../lib/session";
import { db } from "../../../../../lib/db";
import { z } from "zod";

const addMemberSchema = z.object({
  email: z.string().email("Invalid email address."),
});

const removeMemberSchema = z.object({
  userId: z.string(),
});

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const group = await db.group.findFirst({
      where: {
        id: params.groupId,
        members: { some: { userId: user.id } },
      },
      include: {
        members: true,
      },
    });

    if (!group) {
      return new Response("Group not found or you are not a member.", { status: 404 });
    }

    const json = await req.json();
    const body = addMemberSchema.parse(json);

    const userToAdd = await db.user.upsert({
      where: { email: body.email },
      update: {},
      create: {
        email: body.email,
        name: body.email.split('@')[0], // Use email prefix as a default name
      },
    });

    if (!userToAdd) {
      return new Response("User with that email does not exist.", { status: 404 });
    }

    const isAlreadyMember = group.members.some(
      (member) => member.userId === userToAdd.id
    );

    if (isAlreadyMember) {
      return new Response("User is already a member of this group.", { status: 409 });
    }

    await db.groupMember.create({
      data: {
        groupId: params.groupId,
        userId: userToAdd.id,
      },
    });

    return new Response("Member added successfully.", { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 });
    }

    console.error(error);
    return new Response("Something went wrong.", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check if the current user is a member of the group
    const isMember = await db.groupMember.findFirst({
      where: {
        groupId: params.groupId,
        userId: user.id,
      },
    });

    if (!isMember) {
      return new Response("You are not a member of this group.", { status: 403 });
    }

    const json = await req.json();
    const body = removeMemberSchema.parse(json);

    // Check if the user to be removed is in the group
    const memberToRemove = await db.groupMember.findFirst({
      where: {
        groupId: params.groupId,
        userId: body.userId,
      },
    });

    if (!memberToRemove) {
      return new Response("User is not a member of this group.", { status: 404 });
    }

    // Prevent user from removing themselves for now
    if (body.userId === user.id) {
      return new Response("You cannot remove yourself from the group.", { status: 400 });
    }

    await db.groupMember.delete({
      where: {
        id: memberToRemove.id,
      },
    });

    return new Response("Member removed successfully.", { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 });
    }

    console.error(error);
    return new Response("Something went wrong.", { status: 500 });
  }
}

