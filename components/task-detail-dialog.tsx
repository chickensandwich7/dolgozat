"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, History } from "lucide-react";

type Person = { name: string; image?: string | null };
type CommentItem = { id: string; body: string; createdAt: string; author: Person };
type ActivityItem = { id: string; action: string; meta: string | null; createdAt: string; actor: Person };

type FeedItem = {
  kind: "comment" | "activity";
  id: string;
  createdAt: string;
  actor: Person;
  body?: string;
  action?: string;
  meta?: string | null;
};

function describeActivity(item: FeedItem) {
  const name = item.actor?.name || "Someone";
  let meta: { from?: string; to?: string } | null = null;
  try {
    meta = item.meta ? JSON.parse(item.meta) : null;
  } catch {
    meta = null;
  }

  switch (item.action) {
    case "created":
      return `${name} created this task`;
    case "status_changed":
      return `${name} changed status from "${meta?.from}" to "${meta?.to}"`;
    case "reassigned":
      return `${name} reassigned this task`;
    case "commit_linked":
      return `${name} linked a commit`;
    case "moved_project":
      return `${name} moved this task to a different project`;
    case "edited":
      return `${name} edited this task`;
    case "commented":
      return null;
    default:
      return `${name} updated this task`;
  }
}

type TaskLike = { id: string; title: string; description?: string | null } | null;

export function TaskDetailDialog({ task, open, onOpenChange }: { task: TaskLike; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !task) return;
    setIsLoading(true);
    Promise.all([
      fetch(`/api/tasks/${task.id}/comments`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/tasks/${task.id}/activity`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([c, a]) => {
        setComments(c);
        setActivity(a);
      })
      .finally(() => setIsLoading(false));
  }, [open, task?.id]);

  const feed: FeedItem[] = useMemo(() => {
    const commentItems: FeedItem[] = comments.map((c) => ({
      kind: "comment",
      id: c.id,
      createdAt: c.createdAt,
      actor: c.author,
      body: c.body,
    }));
    const activityItems: FeedItem[] = activity
      .filter((a) => a.action !== "commented")
      .map((a) => ({
        kind: "activity",
        id: a.id,
        createdAt: a.createdAt,
        actor: a.actor,
        action: a.action,
        meta: a.meta,
      }));
    return [...commentItems, ...activityItems].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [comments, activity]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !task) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        setComments((prev) => [...prev, created]);
        setNewComment("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>

        {task.description && (
          <p className="text-sm text-muted-foreground border-b pb-4">{task.description}</p>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin min-h-[150px]">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : feed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No activity yet.</p>
          ) : (
            feed.map((item) => (
              <div key={`${item.kind}-${item.id}`} className="flex gap-3">
                {item.kind === "comment" ? (
                  <>
                    <Avatar className="h-7 w-7 shrink-0 border">
                      <AvatarImage src={item.actor?.image || ""} />
                      <AvatarFallback className="text-[10px]">{item.actor?.name?.substring(0, 2).toUpperCase() || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium">{item.actor?.name || "Unknown"}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap break-words">{item.body}</p>
                    </div>
                  </>
                ) : describeActivity(item) ? (
                  <>
                    <div className="h-7 w-7 shrink-0 rounded-full bg-muted flex items-center justify-center">
                      <History className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{describeActivity(item)}</span>
                      <span className="text-[10px] text-muted-foreground/70">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </>
                ) : null}
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t">
          <textarea
            className="flex-1 min-h-[40px] max-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
          />
          <Button size="sm" onClick={handleSubmitComment} disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
