import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 1. Get all expenses where the user is involved (either as payer or in a split)
    const expenses = await db.expense.findMany({
      where: {
        group: {
          members: { some: { userId: user.id } },
        },
      },
      include: {
        payer: true,
        splits: true,
      },
    });

    // 2. Get all settlements where the user is involved
    const settlements = await db.settlement.findMany({
      where: {
        OR: [
          { payerId: user.id },
          { receiverId: user.id },
        ],
      },
    });

    let totalOwedByYou = 0;
    let totalOwedToYou = 0;

    // Calculate balances from expenses
    for (const expense of expenses) {
      const userSplit = expense.splits.find((s) => s.userId === user.id);

      if (expense.payerId === user.id) {
        // You paid the full amount
        totalOwedToYou += expense.amount;
        // But you are responsible for your share
        if (userSplit) {
          totalOwedToYou -= userSplit.amount;
        }
      } else {
        // Someone else paid, you just owe your share
        if (userSplit) {
          totalOwedByYou += userSplit.amount;
        }
      }
    }

    // Adjust balances from settlements
    for (const settlement of settlements) {
      if (settlement.payerId === user.id) {
        // You paid someone, reducing what you owe them
        totalOwedByYou -= settlement.amount;
      } else {
        // Someone paid you, reducing what they owe you
        totalOwedToYou -= settlement.amount;
      }
    }
    
    const netBalance = totalOwedToYou - totalOwedByYou;

    return NextResponse.json({
      totalOwed: netBalance < 0 ? Math.abs(netBalance) : 0,
      totalYouAreOwed: netBalance > 0 ? netBalance : 0,
      netBalance,
    });
  } catch (error) {
    console.error('[DASHBOARD_SUMMARY_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
