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
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground">No pending invitations.</p>
      </div>
    );
  }

  const handleAction = async (invitationId: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        await authClient.organization.acceptInvitation({ invitationId });
      } else {
        await authClient.organization.rejectInvitation({ invitationId });
      }
      
      setInvites((prev) => prev.filter((inv) => inv.id !== invitationId));
      router.refresh();
    } catch (error) {
      console.error(`Error ${action}ing invite:`, error);
      alert(`Failed to ${action} invitation.`);
    }
  };

  return (
    <div className="w-full space-y-4 my-4">
      {invites.map((invite) => (
        <div key={invite.id} className="bg-primary/5 border border-primary/10 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="font-semibold text-base">You have been invited!</h3>
            <p className="text-xs text-muted-foreground">
              To join <strong>{invite.organizationName}</strong> as a <em>{invite.role}</em>.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="default" onClick={() => handleAction(invite.id, 'accept')}>
              Accept
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleAction(invite.id, 'reject')}>
              Decline
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}