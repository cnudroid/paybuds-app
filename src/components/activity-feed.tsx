"use client";

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Expense, Settlement, Group, User } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

// Define combined type for activity items
type ActivityExpense = Expense & { type: 'expense'; group: Group; payer: User };
type ActivitySettlement = Settlement & { type: 'settlement'; group: Group; payer: User; receiver: User };
type ActivityItem = ActivityExpense | ActivitySettlement;

function ActivityListItem({ item }: { item: ActivityItem }) {
  const formattedDate = format(new Date(item.createdAt), 'MMM d, yyyy');

  return (
    <div className="flex items-center gap-4 py-4">
      <Avatar className="h-9 w-9">
        <AvatarImage src={item.payer.image || undefined} alt="Avatar" />
        <AvatarFallback>{item.payer.name?.[0]}</AvatarFallback>
      </Avatar>
      <div className="grid gap-1">
        <p className="text-sm font-medium leading-none">
          {item.type === 'expense' ? (
            <span>
              <strong>{item.payer.name}</strong> added an expense <strong>\"{item.description}\"</strong> in <strong>{item.group.name}</strong>
            </span>
          ) : (
            <span>
              <strong>{item.payer.name}</strong> settled with <strong>{item.receiver.name}</strong> in <strong>{item.group.name}</strong>
            </span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
      </div>
      <div className="ml-auto font-medium">
        {item.type === 'expense' ? `$${item.amount.toFixed(2)}` : `$${item.amount.toFixed(2)}`}
      </div>
    </div>
  );
}

export function ActivityFeed() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const response = await fetch('/api/activity');
        if (!response.ok) {
          throw new Error('Failed to fetch activity');
        }
        const data = await response.json();
        setActivity(data);
      } catch (error) {
        toast.error('Could not load activity feed.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivity();
  }, []);

  if (isLoading) {
    return <p>Loading activity...</p>;
  }

  if (activity.length === 0) {
    return <p>No recent activity.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {activity.map((item) => (
          <ActivityListItem key={`${item.type}-${item.id}`} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}
