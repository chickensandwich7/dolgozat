"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Member = {
  id: string;
  role: string;
  organizationId: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
};

export default function MembersTable({ members }: { members: any[] }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const currentUserMember = members.find((m) => m.userId === session?.user?.id);
  const isOwner = currentUserMember?.role === "owner";

  const handleRemove = async (memberId: string, orgId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    
    setLoadingId(memberId);
    try {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId: orgId,
      });

      if (error) {
        console.error("Better Auth Error:", error);
        alert(`Error: ${error.message || error.status}`);
      } else {
        alert("Member successfully removed!");
        router.refresh(); 
      }
    } catch (err) {
      console.error("System Error:", err);
      alert("An unexpected error occurred.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleLeave = async (memberId: string, orgId: string) => {
    if (!confirm("Are you sure you want to leave this organization?")) return;
    
    setLoadingId(memberId);
    try {
      const { error } = await authClient.organization.leave({
        organizationId: orgId,
      });

      if (error) {
        console.error("Better Auth Error:", error);
        alert(`Error: ${error.message || "Something went wrong"}`);
      } else {
        alert("You have successfully left the organization.");
        router.push("/dashboard"); 
        router.refresh();
      }
    } catch (err) {
      console.error("System Error:", err);
      alert("An unexpected error occurred.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="w-full bg-card rounded-xl border p-4">
      <h2 className="text-xl font-semibold mb-4">Organization Members</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member: Member) => {
              const isMe = member.userId === session?.user?.id;

              return (
                <tr key={member.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{member.user?.name || "Unknown User"}</td>
                  <td className="py-3 text-muted-foreground">{member.user?.email}</td>
                  <td className="py-3 capitalize">{member.role}</td>
                  <td className="py-3 text-right">
                    
                    {isMe ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleLeave(member.id, member.organizationId)}
                        disabled={loadingId === member.id}
                      >
                        {loadingId === member.id ? "Leaving..." : "Leave"}
                      </Button>
                    ) : isOwner ? (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleRemove(member.id, member.organizationId)}
                        disabled={loadingId === member.id}
                      >
                        {loadingId === member.id ? "Removing..." : "Remove"}
                      </Button>
                    ) : (
                      null
                    )}

                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}