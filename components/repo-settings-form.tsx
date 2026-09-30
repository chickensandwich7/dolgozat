"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Github, Gitlab } from "lucide-react";

type ExistingProject = { id: string; name: string; githubRepo: string } | null;

export function RepoSettingsForm({ slug, project, onSaved }: { slug: string; project?: ExistingProject; onSaved?: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const initialParts = project?.githubRepo?.split("|") ?? [];
  const initialProvider = (initialParts.length > 1 ? initialParts[0] : "github") as "github" | "gitlab";
  const initialPath = initialParts.length > 1 ? initialParts[1] : (project?.githubRepo ?? "");

  const [name, setName] = useState(project?.name ?? "");
  const [repoPath, setRepoPath] = useState(initialPath);
  const [provider, setProvider] = useState<"github" | "gitlab">(initialProvider);

  const isEditing = !!project;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && !window.confirm("Update this project's linked repository?")) return;

    setIsLoading(true);
    const combinedRepoData = `${provider}|${repoPath}`;

    try {
      const response = await fetch("/api/projects", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditing
            ? { projectId: project!.id, name, githubRepo: combinedRepoData, slug }
            : { name, githubRepo: combinedRepoData, slug }
        ),
      });

      if (!response.ok) throw new Error("Failed");

      if (!isEditing) {
        setName("");
        setRepoPath("");
      }
      router.refresh();
      onSaved?.();
    } catch (error) {
      alert("Something went wrong during saving.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
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
        <Label htmlFor="repoPath">Repository Path</Label>
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

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isEditing ? "Save Changes" : "Add Project"}
      </Button>
    </form>
  );
}
