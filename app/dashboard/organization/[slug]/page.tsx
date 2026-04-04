import { getOrganizationBySlug } from "@/server/organizations";
import { db } from "@/db/drizzle";
import { task } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, AlertCircle, ListTodo, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { checkDeadlines } from "@/server/notifications";

export default async function OrganizationDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const organization = await getOrganizationBySlug(slug);
  if (!organization) redirect("/dashboard");

  await checkDeadlines(session.user.id, organization.id, slug);

  const allTasks = await db.select().from(task).where(eq(task.organizationId, organization.id));
  
  const stats = {
    total: allTasks.length,
    todo: allTasks.filter(t => t.status === "todo").length,
    inProgress: allTasks.filter(t => t.status === "in_progress").length,
    done: allTasks.filter(t => t.status === "done").length,
    highPriority: allTasks.filter(t => t.priority === "high" && t.status !== "done").length,
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Everything you need to know about {organization.name}.</p>
      </div>

      {/* STATISZTIKAI KÁRTYÁK */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card p-6 rounded-3xl border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Tasks</span>
            <ListTodo className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>

        <div className="bg-card p-6 rounded-3xl border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">In Progress</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">{stats.inProgress}</div>
        </div>

        <div className="bg-card p-6 rounded-3xl border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold">{stats.done}</div>
        </div>

        <div className="bg-card p-6 rounded-3xl border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">High Priority</span>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-500">{stats.highPriority}</div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card p-8 rounded-3xl border shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Ready to work?</h2>
            <p className="text-muted-foreground text-sm">Head over to the tasks</p>
          </div>
          <Button asChild className="w-full mt-8 rounded-xl h-12 text-md font-semibold group">
            <Link href={`/dashboard/organization/${slug}/tasks`}>
              Open Tasks <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        <div className="bg-muted/30 p-8 rounded-3xl border border-dashed flex flex-col justify-center items-center text-center">
            <p className="text-sm text-muted-foreground">You have <span className="font-bold text-foreground">{allTasks.filter(t => t.assigneeId === session.user.id && t.status !== "done").length}</span> active tasks assigned to you.</p>
        </div>
      </div>
    </div>
  );
}