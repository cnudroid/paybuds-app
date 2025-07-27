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
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [showInviteOptions, setShowInviteOptions] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (!email) {
      toast.error("Email is required.");
      setIsLoading(false);
      return;
    }

    try {
      // First try to create an invitation
      const response = await fetch(`/api/groups/${groupId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, sendEmail: false }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.inviteLink) {
          // Invitation already exists, show the existing link
          setInviteLink(data.inviteLink);
          setShowInviteOptions(true);
          toast.info("Invitation already sent", {
            description: "An invitation link has already been generated for this email.",
          });
        } else {
          toast.error("Failed to create invitation.", {
            description: data.error || "Please check the email and try again.",
          });
        }
      } else {
        setInviteLink(data.inviteLink);
        setShowInviteOptions(true);
        toast.success("Invitation link generated!", {
          description: "Share the link below with your friend.",
        });
        setEmail("");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
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
          {isLoading ? "Creating Invite..." : "Create Invite"}
        </Button>
      </form>

      {showInviteOptions && inviteLink && (
        <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Invitation Link Generated</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowInviteOptions(false);
                setInviteLink(null);
              }}
            >
              ×
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Share this link with your friend to invite them to the group:
          </p>
          <div className="flex items-center gap-2">
            <Input
              value={inviteLink}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(inviteLink)}
            >
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This link will expire in 7 days. When your friend clicks it, they'll be prompted to sign in and will automatically join the group.
          </p>
        </div>
      )}
    </div>
  );
}
