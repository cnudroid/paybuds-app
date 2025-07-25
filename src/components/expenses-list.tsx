"use client";

import { useState } from 'react';
import { Prisma, User } from '@prisma/client';
import { ExpenseListItem } from './expense-list-item';
import { ExpenseDetailsModal } from './expense-details-modal';

const expenseWithDetails = Prisma.validator<Prisma.ExpenseDefaultArgs>()({
  include: { payer: true, splits: { include: { user: true } } },
});

type ExpenseWithDetails = Prisma.ExpenseGetPayload<typeof expenseWithDetails>;

interface ExpensesListProps {
  expenses: ExpenseWithDetails[];
  groupMembers: { user: User }[];
}

export function ExpensesList({ expenses, groupMembers }: ExpensesListProps) {
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithDetails | null>(null);

  return (
    <>
      {selectedExpense && (
        <ExpenseDetailsModal
          expense={selectedExpense}
          groupMembers={groupMembers.map(m => m.user)}
          isOpen={!!selectedExpense}
          onClose={() => setSelectedExpense(null)}
        />
      )}

      {expenses.length > 0 ? (
        <ul className="space-y-4">
          {expenses.map((expense) => (
            <ExpenseListItem
              key={expense.id}
              expense={expense}
              onClick={() => setSelectedExpense(expense)}
            />
          ))}
        </ul>
      ) : (
        <div className="text-center border-2 border-dashed rounded-lg p-12">
          <h2 className="text-xl font-semibold">No expenses yet</h2>
          <p className="text-muted-foreground mt-2">
            Add an expense to get started.
          </p>
        </div>
      )}
    </>
  );
}
