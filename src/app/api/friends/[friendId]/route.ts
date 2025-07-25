import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';
import { calculateGroupBalances } from '@/lib/balances';

export async function GET(
  req: Request,
  { params }: { params: { friendId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const friendId = params.friendId;

    // 1. Fetch friend details
    const friend = await db.user.findUnique({
      where: { id: friendId },
    });

    if (!friend) {
      return new NextResponse('Friend not found', { status: 404 });
    }

    // 2. Find all groups shared between the current user and the friend
    const sharedGroups = await db.group.findMany({
      where: {
        AND: [
          { members: { some: { userId: user.id } } },
          { members: { some: { userId: friendId } } },
        ],
      },
      include: {
        members: { include: { user: true } },
        expenses: { include: { payer: true, splits: true } },
        settlements: { include: { payer: true, receiver: true } },
      },
    });

    // 3. Calculate the balance for each shared group and the total balance
    let totalBalance = 0;
    const groupBalances = sharedGroups.map(group => {
      const balances = calculateGroupBalances(group.members, group.expenses, group.settlements);
      const userBalanceInGroup = balances.find(b => b.userId === user.id)?.balance || 0;
      totalBalance += userBalanceInGroup;
      return {
        groupId: group.id,
        groupName: group.name,
        balance: userBalanceInGroup,
      };
    });

    return NextResponse.json({
      friend,
      totalBalance,
      sharedGroups: groupBalances,
    });

  } catch (error) {
    console.error('Failed to fetch friend details:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
