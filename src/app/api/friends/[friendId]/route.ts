import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';

// Type for the friendId parameter
type FriendIdParam = string | string[] | undefined;

interface GroupWithBalance {
  id: string;
  name: string;
  balance: number;
}

interface GroupMemberWithUser {
  id: string;
  userId: string;
  groupId: string;
  balance: number | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
  };
}

interface Params {
  params: {
    friendId: FriendIdParam;
  };
}

export async function GET(
  request: Request,
  { params }: Params
) {
  // Handle both string and string[] cases for friendId
  const friendId = Array.isArray(params.friendId) ? params.friendId[0] : params.friendId;
  
  if (!friendId) {
    return new NextResponse('Friend ID is required', { status: 400 });
  }
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const friendId = params.friendId;

    // 1. Fetch friend details
    const friend = await db.user.findUnique({
      where: { id: friendId },
    });

    if (!friend) {
      return new NextResponse('Friend not found', { status: 404 });
    }

    // 2. Find all groups shared between the current user and the friend
    const friendIdStr = Array.isArray(friendId) ? friendId[0] : friendId;
    if (!friendIdStr) {
      return new NextResponse('Friend ID is required', { status: 400 });
    }

    const sharedGroups = await db.$queryRaw<Array<{ id: string; name: string }>>`
      SELECT g.id, g.name
      FROM "Group" g
      JOIN "GroupMember" gm1 ON g.id = gm1."groupId"
      JOIN "GroupMember" gm2 ON g.id = gm2."groupId"
      WHERE 
        gm1."userId" = ${user.id}::uuid AND 
        gm2."userId" = ${friendIdStr}::uuid
    `;
    
    if (!sharedGroups || sharedGroups.length === 0) {
      return NextResponse.json({
        friend: null,
        totalBalance: 0,
        sharedGroups: [],
      });
    }
    
    if (!sharedGroups || sharedGroups.length === 0) {
      return NextResponse.json({
        friend: null,
        totalBalance: 0,
        sharedGroups: [],
      });
    }

    // 3. Calculate balances for each shared group
    const groupsWithBalances: GroupWithBalance[] = [];
    
    for (const group of sharedGroups) {
      try {
        // Get all group members with their balances
        const members = await db.$queryRaw<GroupMemberWithUser[]>`
          SELECT 
            gm.id, 
            gm."userId", 
            gm."groupId", 
            gm.balance,
            u.id as "user.id",
            u.name as "user.name",
            u.email as "user.email",
            u."emailVerified" as "user.emailVerified",
            u.image as "user.image"
          FROM "GroupMember" gm
          JOIN "User" u ON gm."userId" = u.id
          WHERE 
            gm."groupId" = ${group.id}::uuid AND
            (gm."userId" = ${user.id}::uuid OR gm."userId" = ${friendIdStr}::uuid)
        `;
        
        // Calculate user and friend balances
        const userMember = members.find(m => m.userId === user.id);
        const friendMember = members.find(m => m.userId === friendIdStr);
        
        const userBalance = userMember && userMember.balance !== null ? Number(userMember.balance) : 0;
        const friendBalance = friendMember && friendMember.balance !== null ? Number(friendMember.balance) : 0;
        
        groupsWithBalances.push({
          id: group.id,
          name: group.name,
          balance: userBalance - friendBalance
        });
      } catch (error) {
        console.error(`Error calculating balance for group ${group.id}:`, error);
      }
    }
    
    // 4. Calculate total balance across all groups
    const totalBalance = groupsWithBalances.reduce(
      (sum: number, group: GroupWithBalance) => sum + group.balance,
      0
    );

    return NextResponse.json({
      friend,
      totalBalance,
      sharedGroups: groupsWithBalances,
    });

  } catch (error) {
    console.error('Failed to fetch friend details:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
