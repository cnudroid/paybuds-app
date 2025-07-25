"use client";

import { Prisma } from '@prisma/client';

const expenseWithDetails = Prisma.validator<Prisma.ExpenseDefaultArgs>()({
  include: { payer: true, splits: { include: { user: true } } },
});

type ExpenseWithDetails = Prisma.ExpenseGetPayload<typeof expenseWithDetails>;

interface ExpenseListItemProps {
  expense: ExpenseWithDetails;
  onClick: () => void;
}

export function ExpenseListItem({ expense, onClick }: ExpenseListItemProps) {
  return (
    <li key={expense.id} onClick={onClick} className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
      <div>
        <p className="font-semibold">{expense.description}</p>
        <p className="text-sm text-muted-foreground">
          Paid by {expense.payer.name}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-lg">${expense.amount.toFixed(2)}</p>
      </div>
    </li>
  );
}
