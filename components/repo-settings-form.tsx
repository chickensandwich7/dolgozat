"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";

export function RepoSettingsForm({ slug, initialProject }: { slug: string, initialProject: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [showWarning, setShowWarning] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (initialProject && !showWarning) {
      setShowWarning(true);
      return;
    }

    if (initialProject && !window.confirm("Biztosan felülírod a jelenlegi repót? Ez a művelet nem vonható vissza!")) {
      setShowWarning(false); 
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, githubRepo, slug }),
      });

      if (!response.ok) throw new Error("Failed");

      alert(initialProject ? "Repository replaced successfully!" : "Repository linked successfully!");
      setName("");
      setGithubRepo("");
      setShowWarning(false);
      router.refresh(); 
    } catch (error) {
      alert("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {initialProject && (
        <div className="p-4 bg-accent/50 border rounded-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Currently Linked Repository</p>
            <p className="font-semibold">{initialProject.name} <span className="text-muted-foreground font-normal ml-1">({initialProject.githubRepo})</span></p>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="name">{initialProject ? "New Project Name" : "Project Name"}</Label>
          <Input 
            id="name" 
            placeholder="e.g. Frontend App" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="githubRepo">{initialProject ? "New GitHub Repository" : "GitHub Repository"}</Label>
          <Input 
            id="githubRepo" 
            placeholder="e.g. owner/repo-name" 
            value={githubRepo}
            onChange={(e) => setGithubRepo(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        {showWarning && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md flex gap-2 items-start mt-4">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              <strong>Warning!</strong> You are about to replace the currently linked repository. The previous connection will be lost. Click the button again to confirm.
            </p>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isLoading} 
          variant={initialProject ? "destructive" : "default"}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : initialProject ? (
            showWarning ? "Yes, Replace Repository" : "Replace Repository"
          ) : (
            "Link Repository"
          )}
        </Button>
        
        {showWarning && (
          <Button 
            type="button" 
            variant="outline" 
            className="w-full mt-2" 
            onClick={() => setShowWarning(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </form>
    </div>
  );
}