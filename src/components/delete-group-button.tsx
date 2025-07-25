"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Balance } from "../lib/balances";

interface DeleteGroupButtonProps {
  groupId: string;
  balances: Balance[];
}

export function DeleteGroupButton({ groupId, balances }: DeleteGroupButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isSettled = balances.every((b) => b.balance === 0);

  const handleDeleteGroup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });

      const text = await response.text();

      if (!response.ok) {
        toast.error("Failed to delete group", { description: text });
      } else {
        toast.success("Group deleted successfully");
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
        <Button variant="destructive" disabled={!isSettled || isLoading}>
          Delete Group
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the group and all of its data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteGroup} disabled={isLoading}>
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
