"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, GripVertical, Github, Loader2, Filter, Edit2, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function KanbanBoard({ initialTasks, members, currentUser, isAdmin, slug }: any) {
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
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] mb-3">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-2">
                      {task.githubCommitLink ? (
                        <a href={task.githubCommitLink} target="_blank" className="text-[10px] font-medium flex items-center gap-1.5 text-foreground/70 bg-accent/50 px-2 py-1 rounded-md border border-border/50 transition-colors hover:text-foreground">
                          <Github className="h-3 w-3" /> Commit
                        </a>
                      ) : <div />}
                      <Avatar className="h-6 w-6 border border-border">
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
        <DialogContent>
          <DialogHeader><DialogTitle>Almost there! 🚀</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">To move <strong>{commitPromptTask?.title}</strong> to Done, please provide the GitHub commit link as proof of work.</p>
            <Input placeholder="https://github.com/..." value={commitLink} onChange={(e) => setCommitLink(e.target.value)} />
            <Button onClick={handleCommitSubmit} disabled={isLoading || !commitLink} className="w-full">Submit & Finish Task</Button>
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}