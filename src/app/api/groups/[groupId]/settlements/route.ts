import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

const settlementSchema = z.object({
  receiverId: z.string().cuid(),
  amount: z.number().positive(),
});

export async function POST(
  req: Request
) {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const groupId = pathParts[3];
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    // groupId is already extracted from URL
    const body = await req.json();
    const { receiverId, amount } = settlementSchema.parse(body);

    // 1. Verify both users are members of the group
    const groupMembers = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: { in: [user.id, receiverId] },
      },
    });

    if (groupMembers.length !== 2) {
      return NextResponse.json(
        { error: 'Both payer and receiver must be members of the group' },
        { status: 400 }
      );
    }

    // 2. Create the settlement
    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        amount,
        payerId: user.id,
        receiverId,
      },
    });

    return NextResponse.json(settlement, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating settlement:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
