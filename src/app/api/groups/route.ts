import { NextResponse } from "next/server";
import * as z from "zod";

import { db } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/session";

const createGroupSchema = z.object({
  name: z.string().min(3).max(100),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userGroups = await db.group.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    });

    return new NextResponse(JSON.stringify(userGroups), { status: 200 });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const body = createGroupSchema.parse(json);

    const group = await db.group.create({
      data: {
        name: body.name,
        createdById: user.id,
        members: {
          create: {
            userId: user.id,
          },
        },
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }

    console.error("Error creating group:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
