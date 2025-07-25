'use client';

import type { Settlement, User } from '@prisma/client';

interface SettlementsListProps {
  settlements: (Settlement & { payer: User; receiver: User })[];
}

export function SettlementsList({ settlements }: SettlementsListProps) {
  if (settlements.length === 0) {
    return (
      <div className="text-center border-2 border-dashed rounded-lg p-12">
        <h2 className="text-xl font-semibold">No settlements yet</h2>
        <p className="text-muted-foreground mt-2">Settle up with a group member to see it here.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {settlements.map((settlement) => (
        <li key={settlement.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-semibold">
              {settlement.payer.name || settlement.payer.email} paid {settlement.receiver.name || settlement.receiver.email}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(settlement.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-lg">${settlement.amount.toFixed(2)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
