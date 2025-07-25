"use client";

import { Group, GroupMember, User } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { XIcon } from "lucide-react";

interface GroupMembersListProps {
  group: Group & { members: (GroupMember & { user: User })[] };
  currentUser: User;
}

export function GroupMembersList({ group, currentUser }: GroupMembersListProps) {
  const router = useRouter();
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);

  const handleRemoveMember = async (userId: string) => {
    setLoadingMemberId(userId);
    try {
      const response = await fetch(`/api/groups/${group.id}/members`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const text = await response.text();

      if (!response.ok) {
        toast.error("Failed to remove member", { description: text });
      } else {
        toast.success("Member removed successfully");
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoadingMemberId(null);
    }
  };

  return (
    <ul className="space-y-2">
      {group.members.map((member) => (
        <li key={member.userId} className="flex justify-between items-center p-3 border rounded-lg">
          <div>
            <span className="font-medium">{member.user.name}</span>
            <p className="text-sm text-muted-foreground">{member.user.email}</p>
          </div>
          {member.userId !== currentUser.id && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveMember(member.userId)}
              disabled={loadingMemberId === member.userId}
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Remove member</span>
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
