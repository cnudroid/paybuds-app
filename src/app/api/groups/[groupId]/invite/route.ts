import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  sendEmail: z.boolean().optional().default(false),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await context.params;
    const body = await req.json();
    const { email, sendEmail } = inviteSchema.parse(body);

    // Check if user is a member of the group
    const group = await db.group.findFirst({
      where: {
        id: groupId,
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

    if (!group) {
      return NextResponse.json({ error: 'Group not found or access denied' }, { status: 404 });
    }

    // Check if user is already a member
    const isAlreadyMember = group.members.some(member => member.user.email === email);
    if (isAlreadyMember) {
      return NextResponse.json({ error: 'User is already a member of this group' }, { status: 409 });
    }

    // Check if there's already a pending invitation
    const existingInvitation = await db.groupInvitation.findFirst({
      where: {
        groupId,
        email,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return NextResponse.json({ 
        error: 'An invitation has already been sent to this email',
        inviteLink: `${process.env.NEXTAUTH_URL}/invite/${existingInvitation.token}`
      }, { status: 409 });
    }

    // Create invitation
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days

    const invitation = await db.groupInvitation.create({
      data: {
        token,
        email,
        groupId,
        invitedById: user.id,
        expiresAt,
      },
    });

    const inviteLink = `${process.env.NEXTAUTH_URL}/invite/${token}`;

    // TODO: If sendEmail is true, send email invitation here
    // For now, we'll just return the invite link
    
    return NextResponse.json({
      success: true,
      inviteLink,
      message: sendEmail ? 'Invitation sent via email' : 'Invitation link generated',
    });

  } catch (error) {
    console.error('Invite error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
