"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, GripVertical, Github, Gitlab, Loader2, Filter, Edit2, Trash2, Calendar, GitCommit, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function KanbanBoard({ initialTasks, members, currentUser, isAdmin, slug, githubRepo }: any) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [isLoading, setIsLoading] = useState(false);
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(false);
  
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  const [editingTask, setEditingTask] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editDueDate, setEditDueDate] = useState("");

  const [commitPromptTask, setCommitPromptTask] = useState<any>(null);
  const [commitLink, setCommitLink] = useState("");
  
  const [commits, setCommits] = useState<any[]>([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  const isGitlab = typeof githubRepo === 'string' && githubRepo.startsWith("gitlab|");
  const isGithub = typeof githubRepo === 'string' && githubRepo.startsWith("github|");
  const repoProvider = isGitlab ? "gitlab" : "github"; 
  
  let cleanRepoPath = githubRepo;
  if (isGitlab || isGithub) {
    cleanRepoPath = githubRepo.split("|")[1];
  }

  const columns = [
    { id: "todo", title: "To Do", color: "border-muted-foreground/20", bg: "bg-muted/10" },
    { id: "in_progress", title: "In Progress", color: "border-primary/30", bg: "bg-primary/5" },
    { id: "done", title: "Done", color: "border-emerald-500/30", bg: "bg-emerald-500/5" },
  ];

  const priorityColors: any = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  const getDueDateStatus = (dueDate: string | Date | null, status: string) => {
    if (!dueDate || status === "done") return "text-muted-foreground";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dueDate);
    date.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded"; 
    if (diffDays === 0) return "text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded"; 
    if (diffDays <= 2) return "text-yellow-500 font-medium"; 

    return "text-muted-foreground"; 
  };

  const fetchRecentCommits = async () => {
    if (!cleanRepoPath) return; 
    setIsLoadingCommits(true);
    try {
      if (repoProvider === "gitlab") {
        const encodedPath = encodeURIComponent(cleanRepoPath);
        const res = await fetch(`https://gitlab.com/api/v4/projects/${encodedPath}/repository/commits?per_page=10`);
        if (res.ok) {
          const data = await res.json();
          const normalized = data.map((c: any) => ({
            sha: c.id,
            html_url: c.web_url || `https://gitlab.com/${cleanRepoPath}/-/commit/${c.id}`,
            commit: {
              message: c.title || c.message,
              author: { name: c.author_name }
            }
          }));
          setCommits(normalized);
        }
      } else {
        const res = await fetch(`https://api.github.com/repos/${cleanRepoPath}/commits?per_page=10`);
        if (res.ok) {
          const data = await res.json();
          setCommits(data);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingCommits(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          assigneeId: newTaskAssignee || null,
          priority: newTaskPriority,
          dueDate: newTaskDueDate || null,
          slug,
        }),
      });

      if (res.ok) {
        const createdTask = await res.json();
        setTasks([...tasks, createdTask]);
        setIsNewTaskOpen(false);
        setNewTaskTitle(""); setNewTaskDesc(""); setNewTaskAssignee(""); setNewTaskPriority("medium"); setNewTaskDueDate("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure?")) return;
    setTasks(tasks.filter((t: any) => t.id !== taskId));
    try {
      await fetch(`/api/tasks?taskId=${taskId}&slug=${slug}`, { method: "DELETE" });
    } catch (error) {
      router.refresh();
    }
  };

  const openEditDialog = (task: any) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditAssignee(task.assigneeId || "");
    setEditPriority(task.priority || "medium");
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
  };

  const submitEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setIsLoading(true);

    const updatedTask = { 
      ...editingTask, 
      title: editTitle, 
      description: editDesc, 
      assigneeId: editAssignee || null,
      priority: editPriority,
      dueDate: editDueDate || null
    };
    
    setTasks(tasks.map((t: any) => t.id === editingTask.id ? updatedTask : t));

    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          taskId: editingTask.id, 
          title: editTitle, 
          description: editDesc, 
          assigneeId: editAssignee === "" ? "unassigned" : editAssignee,
          priority: editPriority,
          dueDate: editDueDate || null,
          slug 
        }),
      });
      setEditingTask(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const draggedTask = tasks.find((t: any) => t.id === taskId);
    
    if (!draggedTask || draggedTask.status === newStatus) return;
    
    if (newStatus === "done" && !draggedTask.githubCommitLink) {
      setCommitPromptTask(draggedTask);
      setShowManualInput(!cleanRepoPath); 
      setCommitLink("");
      if (cleanRepoPath) {
        fetchRecentCommits();
      }
      return; 
    }
    
    updateTaskStatus(taskId, newStatus);
  };

  const updateTaskStatus = async (taskId: string, newStatus: string, githubLink?: string) => {
    setTasks(tasks.map((t: any) => t.id === taskId ? { ...t, status: newStatus, githubCommitLink: githubLink || t.githubCommitLink } : t));
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus, githubCommitLink: githubLink, slug }),
      });
      if (!res.ok) router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCommitSubmit = async () => {
    if (!commitPromptTask || !commitLink) return;
    setIsLoading(true);
    await updateTaskStatus(commitPromptTask.id, "done", commitLink);
    setCommitPromptTask(null);
    setCommitLink("");
    setIsLoading(false);
  };

  const visibleTasks = useMemo(() => {
    if (showOnlyMyTasks) return tasks.filter((t: any) => t.assigneeId === currentUser.id);
    return tasks;
  }, [tasks, showOnlyMyTasks, currentUser.id]);

  return (
    <div className="p-6 h-full flex flex-col min-w-[800px]">
      
      <div className="flex justify-between items-center mb-6">
        <Button variant={showOnlyMyTasks ? "default" : "outline"} size="sm" onClick={() => setShowOnlyMyTasks(!showOnlyMyTasks)} className="text-xs h-8">
          <Filter className="h-3 w-3 mr-2" />
          {showOnlyMyTasks ? "Showing My Tasks" : "All Tasks"}
        </Button>

        {isAdmin && (
          <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8"><Plus className="h-4 w-4 mr-2" /> New Task</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Create a New Task</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)}>
                    <option value="">-- Unassigned --</option>
                    {members.map((m: any) => (<option key={m.userId} value={m.userId}>{m.user.name}</option>))}
                  </select>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">Create Task</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex-1 flex gap-6 pb-4">
        {columns.map((col) => (
          <div key={col.id} className={`flex-1 flex flex-col rounded-2xl border-t-[3px] ${col.bg} ${col.color} p-4 shadow-sm`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, col.id)}>
            <h2 className="font-semibold text-sm mb-4 flex items-center justify-between text-muted-foreground uppercase tracking-wider">
              {col.title}
              <span className="bg-background/50 text-foreground text-xs px-2 py-0.5 rounded-full border">
                {visibleTasks.filter((t: any) => t.status === col.id).length}
              </span>
            </h2>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
              {visibleTasks.filter((t: any) => t.status === col.id).map((task: any) => {
                const assignedMember = members.find((m: any) => m.userId === task.assigneeId);
                const isDraggable = isAdmin || task.assigneeId === currentUser.id;

                const dateStyleClass = getDueDateStatus(task.dueDate, task.status);

                return (
                  <div key={task.id} draggable={isDraggable} onDragStart={(e) => handleDragStart(e, task.id)} className={`bg-card p-4 rounded-xl border border-border/50 shadow-sm transition-all duration-200 group flex flex-col ${isDraggable ? 'cursor-grab active:cursor-grabbing hover:border-primary/50' : 'opacity-75'}`}>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className={`text-[10px] w-fit px-2 py-0.5 rounded-full border font-bold uppercase tracking-tighter ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </div>
                        <h3 className="font-medium text-sm leading-tight">{task.title}</h3>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditDialog(task)} className="p-1.5 hover:bg-primary/20 text-primary rounded-md"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 hover:bg-destructive/20 text-destructive rounded-md"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                    )}

                    {task.dueDate && (
                      <div className={`flex items-center gap-1.5 text-[10px] mb-3 transition-colors w-fit ${dateStyleClass}`}>
                        <Calendar className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                        {dateStyleClass.includes("red-500") && " (Overdue)"}
                        {dateStyleClass.includes("amber-500") && " (Today)"}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-2">
                      {task.githubCommitLink ? (
                        <a href={task.githubCommitLink} target="_blank" className="text-[10px] font-medium flex items-center gap-1.5 text-foreground/70 bg-accent/50 px-2 py-1 rounded-md border border-border/50 transition-colors hover:text-foreground">
                          {task.githubCommitLink.includes("gitlab.com") ? (
                            <Gitlab className="h-3 w-3 text-orange-500" />
                          ) : (
                            <Github className="h-3 w-3" />
                          )} 
                          Commit
                        </a>
                      ) : <div />}
                      <Avatar className="h-6 w-6 border border-border">

                        <AvatarImage src={assignedMember?.user?.image || ""} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                        {assignedMember ? assignedMember.user.name.substring(0, 2).toUpperCase() : "?"}
                     </AvatarFallback>
                        </Avatar>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          <form onSubmit={submitEditTask} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editAssignee} onChange={(e) => setEditAssignee(e.target.value)}>
                <option value="">-- Unassigned --</option>
                {members.map((m: any) => (<option key={m.userId} value={m.userId}>{m.user.name}</option>))}
              </select>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!commitPromptTask} onOpenChange={(open) => !open && setCommitPromptTask(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {repoProvider === "gitlab" ? <Gitlab className="h-5 w-5 text-orange-500"/> : <Github className="h-5 w-5"/>} 
              Select a Commit
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-4">Link your work to finish <strong>{commitPromptTask?.title}</strong>.</p>
            
            {!showManualInput && cleanRepoPath ? (
              <div className="space-y-3">
                {isLoadingCommits ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin">
                    {commits.map((commit: any) => {
                      const isSelected = commitLink === commit.html_url;
                      const commitTitle = commit.commit.message.split('\n')[0]; 
                      
                      return (
                        <div 
                          key={commit.sha}
                          onClick={() => setCommitLink(commit.html_url)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-3 w-full overflow-hidden ${isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-accent/50'}`}
                        >
                          <div className={`mt-0.5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                            {isSelected ? <Check className="h-4 w-4" /> : <GitCommit className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-sm font-medium truncate block w-full" title={commitTitle}>{commitTitle}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground truncate max-w-[120px]">{commit.commit.author.name}</span>
                              <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border font-mono shrink-0">
                                {commit.sha.substring(0, 7)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div className="flex justify-center pt-2">
                  <Button variant="link" size="sm" className="text-xs text-muted-foreground" onClick={() => setShowManualInput(true)}>
                    Can't find it? Enter link manually
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-2">
                  <Label>{repoProvider === "gitlab" ? "GitLab" : "GitHub"} Commit URL</Label>
                  <Input placeholder={repoProvider === "gitlab" ? "https://gitlab.com/..." : "https://github.com/..."} value={commitLink} onChange={(e) => setCommitLink(e.target.value)} />
                </div>
                {cleanRepoPath && (
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setShowManualInput(false); setCommitLink(""); }}>
                    ← Back to recent commits
                  </Button>
                )}
              </div>
            )}
            
            <div className="mt-6">
              <Button onClick={handleCommitSubmit} disabled={isLoading || !commitLink} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Link Commit & Finish Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}