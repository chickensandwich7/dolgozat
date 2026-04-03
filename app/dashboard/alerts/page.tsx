"use client";

import { useEffect, useState } from "react";
import { Mail, CheckCircle2, AlertTriangle, BellOff, Check, ArrowRight, ClipboardList, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { PendingInvitations } from "@/components/pending-invitations"; 

export default function AlertsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [notifRes, invitesRes] = await Promise.all([
        fetch("/api/notifications"),
        fetch("/api/invites")
      ]);

      if (notifRes.ok) setNotifications(await notifRes.json());
      if (invitesRes.ok) setInvites(await invitesRes.json());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const markAsRead = async (id: string, link?: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    
    await fetch("/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ notificationId: id }),
    });

    router.refresh();

    if (link) router.push(link);
  };

  const markAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ all: true }),
    });

    router.refresh();
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    setNotifications(notifications.filter(n => n.id !== id));
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    router.refresh(); 
  };

  const clearAllNotifications = async () => {
    if (!window.confirm("Are you sure you want to delete all alerts? This cannot be undone.")) return;
    setNotifications([]);
    await fetch("/api/notifications?all=true", { method: "DELETE" });
    router.refresh();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "invite": return <UserPlus className="h-5 w-5 text-blue-500" />;
      case "task_assigned": return <ClipboardList className="h-5 w-5 text-amber-500" />;
      case "task_completed": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "task_deadline": return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <Mail className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground flex justify-center"><AlertTriangle className="animate-spin h-6 w-6"/></div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground">Manage your invitations and task updates.</p>
        </div>
        
        <div className="flex gap-2">
          {notifications.some(n => !n.isRead) && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" /> Mark all as read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllNotifications} className="text-destructive hover:bg-destructive/10 border-destructive/20">
              <Trash2 className="h-4 w-4 mr-2" /> Clear all
            </Button>
          )}
        </div>
      </div>

      {invites.length > 0 && (
        <div className="mb-8 p-6 bg-primary/5 border border-primary/20 rounded-3xl animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-bold mb-4 text-primary flex items-center gap-2">
            <UserPlus className="h-5 w-5"/> Action Required: Pending Invitations
          </h2>
          <PendingInvitations initialInvites={invites} />
        </div>
      )}

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border border-dashed">
            <BellOff className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No alerts yet</p>
            <p className="text-sm text-muted-foreground/60 text-center max-w-[250px]">
              We'll notify you when you get invited or tasks change.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id}
              onClick={() => markAsRead(n.id, n.actionLink)}
              className={`group relative p-5 rounded-2xl border transition-all cursor-pointer ${
                n.isRead 
                ? 'bg-background border-border/40 opacity-60 hover:opacity-100' 
                : 'bg-card border-border shadow-sm hover:border-primary/40'
              }`}
            >
              <div className="absolute top-5 right-5 flex items-center gap-3">
                {!n.isRead && (
                  <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                )}
                <button 
                  onClick={(e) => deleteNotification(e, n.id)} 
                  className="p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                  title="Delete alert"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex gap-4 pr-12">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                  n.isRead ? 'bg-muted' : 'bg-background border shadow-inner'
                }`}>
                  {getIcon(n.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-semibold text-sm ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {n.title}
                    </h3>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {n.message}
                  </p>
                  
                  {n.actionLink && !n.isRead && (
                    <div className="mt-3 flex items-center text-xs font-bold text-primary gap-1 group-hover:translate-x-1 transition-transform">
                      View details <ArrowRight className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}