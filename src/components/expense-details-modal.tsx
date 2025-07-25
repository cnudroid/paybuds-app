"use client";

import { useState } from 'react';
import { Prisma, User } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { EditExpenseForm } from './edit-expense-form';

const expenseWithDetails = Prisma.validator<Prisma.ExpenseDefaultArgs>()({
  include: { payer: true, splits: { include: { user: true } } },
});

type ExpenseWithDetails = Prisma.ExpenseGetPayload<typeof expenseWithDetails>;

interface ExpenseDetailsModalProps {
  expense: ExpenseWithDetails;
  groupMembers: User[];
  isOpen: boolean;
  onClose: () => void;
}

export function ExpenseDetailsModal({ expense, groupMembers, isOpen, onClose }: ExpenseDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isEditing ? (
          <>
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
            </DialogHeader>
            <EditExpenseForm
              expense={expense}
              groupMembers={groupMembers}
              onFinished={() => setIsEditing(false)}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{expense.description}</DialogTitle>
              <DialogDescription>
                Paid by {expense.payer.name} on {new Date(expense.createdAt).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            <div className="my-4">
              <h3 className="font-semibold mb-2">Total Amount: ${expense.amount.toFixed(2)}</h3>
              <h4 className="font-semibold mb-2">Breakdown:</h4>
              <ul className="space-y-2">
                {expense.splits.map((split) => (
                  <li key={split.id} className="flex justify-between items-center p-2 border rounded-md">
                    <span>{split.user.name}</span>
                    <span className="font-medium">owes ${split.amount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
