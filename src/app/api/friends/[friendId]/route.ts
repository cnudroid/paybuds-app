import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';
import { calculateGroupBalances } from '@/lib/balances';


type FriendRouteContext = { params: { friendId: string } };


interface Member {
  id: string;
  createdAt: Date;
  groupId: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
  };
}

interface ExpenseSplit {
  id: string;
  amount: number;
  userId: string;
  expenseId: string;
}

interface Expense {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  amount: number;
  groupId: string;
  payerId: string;
  description: string;
  category: string;
  date: Date;
  payer: {
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
  };
  splits: ExpenseSplit[];
}

interface Settlement {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  amount: number;
  groupId: string;
  payerId: string;
  receiverId: string;
  payer: {
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
  };
  receiver: {
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
  };
}

interface Balance {
  userId: string;
  balance: number;
}

interface Group {
  id: string;
  name: string;
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
}

export async function GET(
  req: Request,
  context
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const friendId = context.params.friendId;

    // 1. Fetch friend details
    const friend = await db.user.findUnique({
      where: { id: friendId },
    }) as { id: string; name: string } | null;

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
    }) as Group[];

    // 3. Calculate the balance for each shared group and the total balance
    let totalBalance = 0;
    const groupBalances = sharedGroups.map((group: Group) => {
      const balances: Balance[] = calculateGroupBalances(group.members, group.expenses, group.settlements);
      const userBalanceInGroup = balances.find((b: Balance) => b.userId === user.id)?.balance || 0;
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
