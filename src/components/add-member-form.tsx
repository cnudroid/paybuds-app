"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface AddMemberFormProps {
  groupId: string;
}

export function AddMemberForm({ groupId }: AddMemberFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (!email) {
      toast.error("Email is required.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const text = await response.text();

      if (!response.ok) {
        toast.error("Failed to add member.", {
          description: text || "Please check the email and try again.",
        });
      } else {
        toast.success("Member added successfully!");
        setEmail("");
        router.refresh(); // Refresh the page to show the new member
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 mt-4">
      <div className="grid flex-1 gap-1.5">
        <Label htmlFor="email" className="sr-only">Add by email</Label>
        <Input
          id="email"
          type="email"
          placeholder="member@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Adding..." : "Add Member"}
      </Button>
    </form>
  );
}
