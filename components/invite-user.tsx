"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchUsersToInvite } from "@/server/users"; 
import { authClient } from "@/lib/auth-client"; 

export function InviteUser({ activeOrganizationId }: { activeOrganizationId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        setIsSearching(true);
        const users = await searchUsersToInvite(activeOrganizationId, query);
        setResults(users);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [query, activeOrganizationId]);

 const handleInvite = async (email: string) => {
    try {
      const { data, error } = await authClient.organization.inviteMember({
        email: email,
        role: "member",
        organizationId: activeOrganizationId,
      });

      if (error) {
        console.error("Better Auth Error Details:", {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
        });

        if (error.status === 422 || error.status === 409) {
          alert("This user has already been invited or is already a member of this organization.");
        } else {
          alert(`Failed to send invitation: ${error.message || "Unknown error"}`);
        }
        return; 
      }
      
      alert(`Invitation sent successfully to: ${email}`);
      setQuery("");
      setResults([]);
    } catch (err) {
      console.error("System Error:", err);
      alert("An unexpected error occurred!");
    }
  };

  return (
    <div className="w-full max-w-md space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Invite Member</h3>
        <Input
          placeholder="Search by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isSearching && <p className="text-sm text-muted-foreground">Searching...</p>}

      <div className="space-y-2">
        {results.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button size="sm" onClick={() => handleInvite(user.email)}>
              Invite
            </Button>
          </div>
        ))}
        {query.length >= 2 && results.length === 0 && !isSearching && (
          <p className="text-sm text-muted-foreground">No results found.</p>
        )}
      </div>
    </div>
  );
}