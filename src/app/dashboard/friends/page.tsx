"use client";

import { useState, useEffect } from 'react';
import { User } from '@prisma/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export default function FriendsPage() {
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFriends() {
      try {
        const response = await fetch('/api/friends');
        if (!response.ok) {
          throw new Error('Failed to fetch friends');
        }
        const data = await response.json();
        setFriends(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFriends();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold">Friends</h1>
      <div className="mt-6">
        {isLoading ? (
          <p>Loading friends...</p>
        ) : friends.length > 0 ? (
          <ul className="space-y-4">
            {friends.map((friend) => (
              <li key={friend.id}>
                <Link href={`/dashboard/friends/${friend.id}`} className="flex items-center p-4 border rounded-lg hover:bg-gray-50">

                <Avatar>
                  <AvatarImage src={friend.image || ''} alt={friend.name || 'User'} />
                  <AvatarFallback>{friend.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <p className="font-semibold">{friend.name}</p>
                  <p className="text-sm text-gray-500">{friend.email}</p>
                </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>You don&apos;t have any friends yet. Add them to a group to see them here.</p>
        )}
      </div>
    </div>
  );
}
