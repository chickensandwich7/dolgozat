"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Github, Gitlab, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RepoSettingsForm } from "@/components/repo-settings-form";

export function ProjectCard({ project, slug }: { project: { id: string; name: string; githubRepo: string }; slug: string }) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const parts = project.githubRepo.split("|");
  const provider = parts.length > 1 ? parts[0] : "github";
  const repoPath = parts.length > 1 ? parts[1] : project.githubRepo;

  const handleDelete = async () => {
    if (!window.confirm(`Delete project "${project.name}"? Its tasks will become unassigned from any project.`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects?projectId=${project.id}&slug=${slug}`, { method: "DELETE" });
      if (!res.ok) alert("Failed to delete project.");
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 bg-accent/50 border rounded-lg flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Project</p>
        <div className="flex items-center gap-2 font-semibold">
          {provider === "gitlab" ? <Gitlab className="w-4 h-4 text-orange-500 shrink-0" /> : <Github className="w-4 h-4 shrink-0" />}
          <span className="truncate">{project.name}</span>
          <span className="text-muted-foreground font-normal truncate">({repoPath})</span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
            </DialogHeader>
            <RepoSettingsForm slug={slug} project={project} onSaved={() => setIsEditOpen(false)} />
          </DialogContent>
        </Dialog>
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isDeleting} className="text-destructive hover:bg-destructive/10">
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
