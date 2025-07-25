"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { User } from '@prisma/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

interface FriendDetails {
  friend: User;
  totalBalance: number;
  sharedGroups: {
    groupId: string;
    groupName: string;
    balance: number;
  }[];
}

export default function FriendDetailPage() {
  const params = useParams();
  const friendId = params.friendId as string;
  const [details, setDetails] = useState<FriendDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!friendId) return;

    async function fetchFriendDetails() {
      try {
        const response = await fetch(`/api/friends/${friendId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch friend details');
        }
        const data = await response.json();
        setDetails(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFriendDetails();
  }, [friendId]);

  if (isLoading) {
    return <div>Loading friend details...</div>;
  }

  if (!details) {
    return <div>Could not load friend details.</div>;
  }

  const { friend, totalBalance, sharedGroups } = details;

  const getBalanceText = (balance: number) => {
    if (balance > 0) return <span className="text-green-600">You are owed ${balance.toFixed(2)}</span>;
    if (balance < 0) return <span className="text-red-600">You owe ${(-balance).toFixed(2)}</span>;
    return <span>Settled up</span>;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={friend.image || ''} alt={friend.name || 'User'} />
          <AvatarFallback className="text-2xl">{friend.name?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{friend.name}</h1>
          <p className="text-lg text-gray-500">{getBalanceText(totalBalance)} overall</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Shared Groups</h2>
        {sharedGroups.length > 0 ? (
          <ul className="space-y-3">
            {sharedGroups.map(group => (
              <li key={group.groupId}>
                <Link href={`/dashboard/groups/${group.groupId}`}>
                  <a className="block p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{group.groupName}</span>
                      <span>{getBalanceText(group.balance)}</span>
                    </div>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>You have no shared groups with this friend.</p>
        )}
      </div>
    </div>
  );
}
