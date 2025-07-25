import { Expense, ExpenseSplit, GroupMember, Settlement, User } from "@prisma/client";

export interface Balance {
  userId: string;
  userName: string;
  balance: number;
}

export function calculateGroupBalances(
  members: (GroupMember & { user: User })[],
  expenses: (Expense & { splits: ExpenseSplit[] })[],
  settlements: Settlement[]
): Balance[] {
  const balances: { [userId: string]: number } = {};

  // Initialize balances for all members
  for (const member of members) {
    balances[member.userId] = 0;
  }

  // 1. Calculate balances from expenses
  for (const expense of expenses) {
    // The user who paid the expense is owed money (balance increases)
    if (balances[expense.paidById] !== undefined) {
      balances[expense.paidById] += expense.amount;
    }

    // The users who the expense was split for owe money (balance decreases)
    for (const split of expense.splits) {
      if (balances[split.userId] !== undefined) {
        balances[split.userId] -= split.amount;
      }
    }
  }

  // 2. Adjust balances based on settlements
  for (const settlement of settlements) {
    // The user who paid the settlement has reduced their debt (balance increases)
    if (balances[settlement.payerId] !== undefined) {
      balances[settlement.payerId] += settlement.amount;
    }

    // The user who received the settlement has been paid back (balance decreases)
    if (balances[settlement.receiverId] !== undefined) {
      balances[settlement.receiverId] -= settlement.amount;
    }
  }

  return members.map(member => ({
    userId: member.userId,
    userName: member.user.name || member.user.email || 'Unknown User',
    balance: balances[member.userId],
  }));
}
