"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, Github, Gitlab } from "lucide-react";

export function RepoSettingsForm({ slug, initialProject }: { slug: string, initialProject: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [repoPath, setRepoPath] = useState("");
  const [provider, setProvider] = useState<"github" | "gitlab">("github");
  const [showWarning, setShowWarning] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (initialProject && !showWarning) {
      setShowWarning(true);
      return;
    }

    if (initialProject && !window.confirm("Are you sure you want to replace the current repository? This action cannot be undone!")) {
      setShowWarning(false); 
      return;
    }

    setIsLoading(true);

    const combinedRepoData = `${provider}|${repoPath}`;

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, githubRepo: combinedRepoData, slug }),
      });

      if (!response.ok) throw new Error("Failed");

      alert(initialProject ? "Repository replaced successfully!" : "Repository linked successfully!");
      setName("");
      setRepoPath("");
      setShowWarning(false);
      router.refresh(); 
    } catch (error) {
      alert("Something went wrong during saving.");
    } finally {
      setIsLoading(false);
    }
  };

  const displayLinkedRepo = () => {
    if (!initialProject || !initialProject.githubRepo) return null;
    const parts = initialProject.githubRepo.split("|");
    const linkedProvider = parts.length > 1 ? parts[0] : "github";
    const linkedPath = parts.length > 1 ? parts[1] : initialProject.githubRepo;

    return (
      <div className="p-4 bg-accent/50 border rounded-lg flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Currently Linked Repository</p>
          <div className="flex items-center gap-2 font-semibold">
            {linkedProvider === "gitlab" ? <Gitlab className="w-4 h-4 text-orange-500" /> : <Github className="w-4 h-4" />}
            {initialProject.name} 
            <span className="text-muted-foreground font-normal ml-1">({linkedPath})</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {displayLinkedRepo()}

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
          <Label>Provider</Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setProvider("github")}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-md transition-all ${
                provider === "github" 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-background hover:bg-accent text-muted-foreground"
              }`}
            >
              <Github className="w-5 h-5" /> GitHub
            </button>
            <button
              type="button"
              onClick={() => setProvider("gitlab")}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-md transition-all ${
                provider === "gitlab" 
                  ? "bg-orange-500 text-white border-orange-500" 
                  : "bg-background hover:bg-accent text-muted-foreground"
              }`}
            >
              <Gitlab className="w-5 h-5" /> GitLab
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="repoPath">{initialProject ? "New Repository Path" : "Repository Path"}</Label>
          <Input 
            id="repoPath" 
            placeholder="e.g. owner/repo-name" 
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            disabled={isLoading}
            required
          />
          <p className="text-xs text-muted-foreground">
            {provider === "github" ? "The GitHub account and repository name." : "The GitLab account and repository name."}
          </p>
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