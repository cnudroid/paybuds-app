"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

const createGroupSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters long."),
});

type FormData = z.infer<typeof createGroupSchema>;

export function CreateGroupForm() {
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(createGroupSchema),
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const response = await fetch(`/api/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name,
      }),
    });

    setIsLoading(false);

    if (!response.ok) {
      return toast.error("Something went wrong.", {
        description: "Your group was not created. Please try again.",
      });
    }

    toast.success("Your group has been created.");

    const group = await response.json();

    // This forces a cache invalidation.
    router.refresh();
    router.push(`/dashboard/groups/${group.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Group Name</Label>
        <Input
          id="name"
          placeholder="e.g., Trip to Bali"
          {...register("name")}
        />
        {errors?.name && (
          <p className="px-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Group"}
      </Button>
    </form>
  );
}
