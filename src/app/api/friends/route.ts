import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 1. Find all groups the current user is a member of.
    const userGroups = await db.group.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    // 2. Collect all members from those groups and make them unique.
    const friendsMap = new Map();
    userGroups.forEach(group => {
      group.members.forEach(member => {
        // 3. Filter out the current user and add others to the map.
        if (member.userId !== user.id) {
          friendsMap.set(member.userId, member.user);
        }
      });
    });

    const friends = Array.from(friendsMap.values());

    return NextResponse.json(friends);
  } catch (error) {
    console.error('Failed to fetch friends:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
