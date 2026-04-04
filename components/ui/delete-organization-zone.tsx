"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteOrganizationZone({ slug }: { slug: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteOrganization = async () => {
    const confirmName = window.prompt(
      "WARNING: This will permanently delete the organization and all associated tasks.\n\nPlease type DELETE to confirm:"
    );

    if (confirmName !== "DELETE") return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/organization?slug=${slug}`, {
        method: "DELETE",
      });

      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        alert("Failed to delete organization.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="border border-red-500/20 rounded-xl overflow-hidden bg-red-500/5">
      <div className="bg-red-500/10 p-4 border-b border-red-500/20 flex items-center gap-2 text-red-600">
        <AlertTriangle className="h-5 w-5" />
        <h2 className="font-bold">Danger Zone</h2>
      </div>
      
      <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-foreground text-sm">Delete this organization</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Once you delete an organization, there is no going back. Please be certain.
          </p>
        </div>
        
        <Button 
          variant="destructive" 
          onClick={handleDeleteOrganization}
          disabled={isDeleting}
          className="shrink-0 font-semibold"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Delete Organization
        </Button>
      </div>
    </section>
  );
}