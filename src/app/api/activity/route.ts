import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userGroups = await db.group.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      select: {
        id: true,
      },
    });

    const groupIds = userGroups.map((g) => g.id);

    const expenses = await db.expense.findMany({
      where: {
        groupId: {
          in: groupIds,
        },
      },
      include: {
        group: true,
        payer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const settlements = await db.settlement.findMany({
      where: {
        groupId: {
          in: groupIds,
        },
      },
      include: {
        group: true,
        payer: true,
        receiver: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const activity = [
      ...expenses.map((e) => ({ ...e, type: 'expense' })),
      ...settlements.map((s) => ({ ...s, type: 'settlement' })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json(activity);
  } catch (error) {
    console.error('[ACTIVITY_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
