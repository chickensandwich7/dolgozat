"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type Invite = {
  id: string;
  organizationId: string;
  organizationName: string;
  role: string | null;
};

export function PendingInvitations({ initialInvites }: { initialInvites: Invite[] }) {
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const router = useRouter();

  if (invites.length === 0) {
    return null;
  }

  const handleAccept = async (invitationId: string) => {
    try {
      await authClient.organization.acceptInvitation({ invitationId });
      setInvites((prev) => prev.filter((inv) => inv.id !== invitationId));
      router.refresh();
    } catch (error) {
      console.error("Error accepting invite:", error);
      alert("Failed to accept invitation.");
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      await authClient.organization.rejectInvitation({ invitationId });
      setInvites((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (error) {
      console.error("Error declining invite:", error);
      alert("Failed to decline invitation.");
    }
  };

  const handleLater = (invitationId: string) => {
    setInvites((prev) => prev.filter((inv) => inv.id !== invitationId));
  };

  return (
    <div className="w-full space-y-4 mb-8">
      {invites.map((invite) => (
        <div key={invite.id} className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">You have been invited!</h3>
            <p className="text-sm text-muted-foreground">
              You have a pending invitation to join <strong>{invite.organizationName}</strong> as a <em>{invite.role}</em>.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="default" onClick={() => handleAccept(invite.id)}>
              Accept
            </Button>
            <Button variant="destructive" onClick={() => handleDecline(invite.id)}>
              Decline
            </Button>
            <Button variant="outline" onClick={() => handleLater(invite.id)}>
              Later
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}