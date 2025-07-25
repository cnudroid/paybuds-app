"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Balance } from "../lib/balances";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";

interface LeaveGroupButtonProps {
  groupId: string;
  userBalance: Balance | undefined;
}

export function LeaveGroupButton({ groupId, userBalance }: LeaveGroupButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const canLeave = userBalance?.balance === 0;

  const handleLeaveGroup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: "DELETE",
      });

      const text = await response.text();

      if (!response.ok) {
        toast.error("Failed to leave group", { description: text });
      } else {
        toast.success("You have left the group.");
        router.push("/dashboard/groups");
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={!canLeave || isLoading}>
          Leave Group
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. You can only rejoin if another member invites you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLeaveGroup} disabled={isLoading}>
            {isLoading ? "Leaving..." : "Leave"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
