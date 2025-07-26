'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AddExpenseForm } from '@/components/add-expense-form';
import { Group, User } from '@prisma/client';

export function AddExpenseClient() {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group & { members: { user: User }[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userRes = await fetch('/api/auth/session');
        const session = await userRes.json();
        setUser(session?.user || null);
        
        if (!session?.user) {
          return;
        }

        // Fetch group data
        const groupRes = await fetch(`/api/groups/${groupId}`);
        if (!groupRes.ok) {
          throw new Error('Failed to fetch group');
        }
        const groupData = await groupRes.json();
        setGroup(groupData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [groupId]);

  if (isLoading || !group || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Expense</h1>
        <p className="text-muted-foreground">In group: {group.name}</p>
      </div>
      <AddExpenseForm group={group} currentUser={user} />
    </div>
  );
}
