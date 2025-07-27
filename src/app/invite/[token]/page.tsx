import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  
  // Find the invitation
  const invitation = await db.groupInvitation.findUnique({
    where: { token },
    include: {
      group: true,
      invitedBy: true,
    },
  });

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Invalid Invitation</h1>
          <p className="text-muted-foreground">This invitation link is invalid or has expired.</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Invitation Expired</h1>
          <p className="text-muted-foreground">This invitation has expired or has already been used.</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();
  
  if (!user) {
    // User is not signed in, redirect to sign in with the invitation token
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
  }

  // Check if user's email matches the invitation
  if (user.email !== invitation.email) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Email Mismatch</h1>
          <p className="text-muted-foreground">
            This invitation was sent to {invitation.email}, but you're signed in as {user.email}.
          </p>
          <p className="text-sm text-muted-foreground">
            Please sign in with the correct email address or contact the person who invited you.
          </p>
          <div className="space-x-2">
            <Link href="/auth/signin">
              <Button variant="outline">Sign in with different account</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Auto-accept the invitation
  try {
    await db.$transaction(async (tx) => {
      // Check if user is already a member
      const existingMember = await tx.groupMember.findFirst({
        where: {
          groupId: invitation.groupId,
          userId: user.id,
        },
      });

      if (!existingMember) {
        // Add user to group
        await tx.groupMember.create({
          data: {
            groupId: invitation.groupId,
            userId: user.id,
          },
        });
      }

      // Mark invitation as accepted
      await tx.groupInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          acceptedById: user.id,
        },
      });
    });

    redirect(`/dashboard/groups/${invitation.groupId}`);
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Error</h1>
          <p className="text-muted-foreground">
            There was an error accepting the invitation. Please try again.
          </p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }
}
