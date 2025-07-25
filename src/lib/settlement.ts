import { User, SettlementSuggestion } from '@/types';

export interface UserBalance {
  userId: string;
  amount: number;
  user: User;
}

export interface DebtSimplificationResult {
  transactions: SettlementSuggestion[];
  totalTransactions: number;
  totalAmountSettled: number;
}

/**
 * Simplifies debts within a group to minimize the number of transactions
 * Uses a greedy algorithm to match largest creditors with largest debtors
 */
export function simplifyDebts(balances: UserBalance[]): DebtSimplificationResult {
  // Filter out users with zero balance
  const nonZeroBalances = balances.filter(balance => Math.abs(balance.amount) > 0.01);
  
  if (nonZeroBalances.length === 0) {
    return {
      transactions: [],
      totalTransactions: 0,
      totalAmountSettled: 0
    };
  }

  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors = nonZeroBalances
    .filter(balance => balance.amount > 0)
    .sort((a, b) => b.amount - a.amount); // Sort by amount descending
  
  const debtors = nonZeroBalances
    .filter(balance => balance.amount < 0)
    .map(balance => ({ ...balance, amount: Math.abs(balance.amount) }))
    .sort((a, b) => b.amount - a.amount); // Sort by amount descending

  const transactions: SettlementSuggestion[] = [];
  let totalAmountSettled = 0;

  // Create working copies
  const workingCreditors = [...creditors];
  const workingDebtors = [...debtors];

  while (workingCreditors.length > 0 && workingDebtors.length > 0) {
    const maxCreditor = workingCreditors[0];
    const maxDebtor = workingDebtors[0];

    // Calculate settlement amount (minimum of what creditor is owed and debtor owes)
    const settleAmount = Math.min(maxCreditor.amount, maxDebtor.amount);

    // Create transaction
    transactions.push({
      fromUserId: maxDebtor.userId,
      toUserId: maxCreditor.userId,
      amount: settleAmount,
      fromUser: maxDebtor.user,
      toUser: maxCreditor.user
    });

    totalAmountSettled += settleAmount;

    // Update balances
    maxCreditor.amount -= settleAmount;
    maxDebtor.amount -= settleAmount;

    // Remove settled users
    if (maxCreditor.amount <= 0.01) {
      workingCreditors.shift();
    }
    if (maxDebtor.amount <= 0.01) {
      workingDebtors.shift();
    }

    // Re-sort if needed (though with greedy approach, largest should still be first)
    workingCreditors.sort((a, b) => b.amount - a.amount);
    workingDebtors.sort((a, b) => b.amount - a.amount);
  }

  return {
    transactions,
    totalTransactions: transactions.length,
    totalAmountSettled
  };
}

/**
 * Calculates individual balances between users in a group
 */
export function calculatePairwiseBalances(
  expenses: Array<{
    paidById: string;
    splits: Array<{ userId: string; amount: number }>;
  }>
): Map<string, Map<string, number>> {
  const balances = new Map<string, Map<string, number>>();

  expenses.forEach(expense => {
    expense.splits.forEach(split => {
      if (split.userId !== expense.paidById) {
        // split.userId owes expense.paidById the split amount
        if (!balances.has(split.userId)) {
          balances.set(split.userId, new Map());
        }
        if (!balances.has(expense.paidById)) {
          balances.set(expense.paidById, new Map());
        }

        const userBalances = balances.get(split.userId)!;
        const paidByBalances = balances.get(expense.paidById)!;

        // Update balance: split.userId owes expense.paidById
        const currentOwed = userBalances.get(expense.paidById) || 0;
        const currentOwedBack = paidByBalances.get(split.userId) || 0;

        if (currentOwedBack >= split.amount) {
          // Reduce what paidBy owes to user
          paidByBalances.set(split.userId, currentOwedBack - split.amount);
        } else {
          // Clear what paidBy owes and set what user owes
          paidByBalances.set(split.userId, 0);
          userBalances.set(expense.paidById, currentOwed + (split.amount - currentOwedBack));
        }
      }
    });
  });

  // Clean up zero balances
  balances.forEach((userBalances, userId) => {
    userBalances.forEach((amount, otherUserId) => {
      if (Math.abs(amount) < 0.01) {
        userBalances.delete(otherUserId);
      }
    });
    if (userBalances.size === 0) {
      balances.delete(userId);
    }
  });

  return balances;
}

/**
 * Calculates net balance for each user (total owed - total owing)
 */
export function calculateNetBalances(
  expenses: Array<{
    paidById: string;
    splits: Array<{ userId: string; amount: number }>;
  }>,
  users: User[]
): UserBalance[] {
  const netBalances = new Map<string, number>();

  // Initialize all users with 0 balance
  users.forEach(user => {
    netBalances.set(user.id, 0);
  });

  expenses.forEach(expense => {
    const totalPaid = expense.splits.reduce((sum, split) => sum + split.amount, 0);
    
    // Person who paid gets positive balance
    const currentPaidBalance = netBalances.get(expense.paidById) || 0;
    netBalances.set(expense.paidById, currentPaidBalance + totalPaid);

    // People who owe get negative balance
    expense.splits.forEach(split => {
      const currentSplitBalance = netBalances.get(split.userId) || 0;
      netBalances.set(split.userId, currentSplitBalance - split.amount);
    });
  });

  return users.map(user => ({
    userId: user.id,
    amount: netBalances.get(user.id) || 0,
    user
  }));
}
