"use client";

import { Group } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface EditGroupNameFormProps {
  group: Group;
}

export function EditGroupNameForm({ group }: EditGroupNameFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(group.name);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const text = await response.text();

      if (!response.ok) {
        toast.error("Failed to update group name", { description: text });
      } else {
        toast.success("Group name updated successfully!");
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Group Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={isLoading || name === group.name}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
