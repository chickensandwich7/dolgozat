"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Building2, Bell, Plus, LayoutDashboard, ChevronLeft, 
  ChevronRight, CheckSquare, Users, Settings, ChevronDown, UserPlus, GitCommit 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logout } from "@/components/ui/logout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateOrganizationForm } from "@/components/forms/create-organization-form";
import { InviteUser } from "@/components/invite-user";
import { cn } from "@/lib/utils";

interface SidebarProps {
  organizations: any[];
  pendingInvites: any[];
  user: any;
  initials: string;
  unreadCount?: number; 
}

export function SidebarUI({ organizations, pendingInvites, user, initials, unreadCount = 0 }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  
  const pathname = usePathname();

  const match = pathname.match(/\/dashboard\/organization\/([^\/]+)/);
  const currentSlug = match ? match[1] : null;
  const currentOrg = organizations.find((o) => o.slug === currentSlug);

  const role = currentOrg?.userRole || "member";
  const isAdminOrOwner = role === "owner" || role === "admin";

  return (
    <aside
      className={cn(
        "relative border-r bg-card flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out shrink-0",
        isCollapsed ? "w-[70px]" : "w-64"
      )}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-12 bg-background border rounded-full p-1 hover:bg-accent z-50 transition-transform shadow-sm"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="p-6 overflow-hidden shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 font-bold text-lg">
          <LayoutDashboard className="h-6 w-6 text-primary shrink-0" />
          {!isCollapsed && <span className="truncate">ProjectManager</span>}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-thin">
        
        {currentSlug && currentOrg ? (
          <div>
            {!isCollapsed && (
              <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-4 px-3 truncate">
                {currentOrg.name} Menu
              </p>
            )}
            <div className="space-y-1">
              <Link
                href={`/dashboard/organization/${currentSlug}`}
                className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", pathname === `/dashboard/organization/${currentSlug}` ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>Dashboard Home</span>}
              </Link>

              <Link
                href={`/dashboard/organization/${currentSlug}/tasks`}
                className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", pathname.includes("/tasks") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
              >
                <CheckSquare className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>Tasks</span>}
              </Link>

              <Link
                href={`/dashboard/organization/${currentSlug}/commits`}
                className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", pathname.includes("/commits") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
              >
                <GitCommit className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>Commits</span>}
              </Link>
              {isAdminOrOwner && (
                <>
                  <Link
                    href={`/dashboard/organization/${currentSlug}/members`}
                    className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", pathname.includes("/members") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span>Members</span>}
                  </Link>

                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                        <UserPlus className="h-4 w-4 shrink-0" />
                        {!isCollapsed && <span>Invite</span>}
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite to {currentOrg.name}</DialogTitle>
                      </DialogHeader>
                      <InviteUser activeOrganizationId={currentOrg.id} />
                    </DialogContent>
                  </Dialog>

                  <Link
                    href={`/dashboard/organization/${currentSlug}/settings`}
                    className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", pathname.includes("/settings") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
                  >
                    <Settings className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span>Settings (Repo)</span>}
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
           <div>
            {!isCollapsed && (
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-4 px-3">
                Main Menu
              </p>
            )}
            <Link
              href="/dashboard"
              className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", pathname === "/dashboard" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Overview</span>}
            </Link>
           </div>
        )}

        <div>
          {!isCollapsed && (
             <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-4 px-3 mt-6">
               Notifications
             </p>
          )}
          <Link
            href="/dashboard/alerts"
            className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", pathname === "/dashboard/alerts" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
          >
            <Bell className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="flex-1 text-left">Alerts</span>}
            
            {unreadCount > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="p-3 border-t bg-card mt-auto shrink-0 space-y-3 relative">
        
        {!isCollapsed ? (
          <Dialog>
            <div className="relative">
              <button 
                onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                className="flex items-center justify-between w-full px-3 py-2 bg-background border rounded-md text-sm font-medium hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{currentOrg ? currentOrg.name : "Select Org..."}</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
              </button>

              {isOrgDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsOrgDropdownOpen(false)}
                  />
                  <div className="absolute bottom-full left-0 w-full mb-2 bg-popover border rounded-md shadow-lg z-50 overflow-hidden flex flex-col">
                    <p className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/50 border-b">
                      Switch Organization
                    </p>
                    <div className="max-h-40 overflow-y-auto scrollbar-thin">
                      {organizations.map((org) => (
                        <Link
                          key={org.id}
                          href={`/dashboard/organization/${org.slug}`}
                          onClick={() => setIsOrgDropdownOpen(false)}
                          className={cn(
                            "block px-3 py-2 text-sm transition-colors",
                            currentSlug === org.slug ? "bg-accent font-semibold text-accent-foreground" : "hover:bg-accent text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {org.name}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t bg-muted/20">
                      <DialogTrigger asChild>
                        <button
                          onClick={() => setIsOrgDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 w-full text-sm font-medium text-primary hover:bg-accent transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          New Organization
                        </button>
                      </DialogTrigger>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Organization</DialogTitle>
              </DialogHeader>
              <CreateOrganizationForm />
            </DialogContent>
          </Dialog>
        ) : (
           <button 
             title="Switch Organization"
             onClick={() => setIsCollapsed(false)}
             className="flex items-center justify-center w-full p-2 rounded-md bg-accent text-accent-foreground"
           >
             <Building2 className="h-4 w-4" />
           </button>
        )}

        <div className="flex items-center gap-3 px-2 pt-2 border-t overflow-hidden">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium truncate">{user.name}</span>
              <Logout />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}