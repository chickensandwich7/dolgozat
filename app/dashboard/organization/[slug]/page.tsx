import { getOrganizationBySlug } from "@/server/organizations";
import { db } from "@/db/drizzle";
import { task } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, AlertCircle, AlertTriangle, ListTodo, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { checkDeadlines } from "@/server/notifications";
import { StatusDonut } from "@/components/analytics/status-donut";
import { PriorityBar } from "@/components/analytics/priority-bar";
import { CompletionLine } from "@/components/analytics/completion-line";
import { MemberLeaderboard } from "@/components/analytics/member-leaderboard";

export default async function OrganizationDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const organization = await getOrganizationBySlug(slug);
  if (!organization) redirect("/dashboard");

  await checkDeadlines(session.user.id, organization.id, slug);

  const allTasks = await db.select().from(task).where(eq(task.organizationId, organization.id));

  const now = new Date();
  const stats = {
    total: allTasks.length,
    inProgress: allTasks.filter((t) => t.status === "in_progress").length,
    done: allTasks.filter((t) => t.status === "done").length,
    highPriority: allTasks.filter((t) => t.priority === "high" && t.status !== "done").length,
    overdue: allTasks.filter((t) => t.dueDate && t.dueDate < now && t.status !== "done").length,
  };

  const statusLabels: Record<string, string> = { todo: "To Do", in_progress: "In Progress", done: "Done" };
  const statusData = ["todo", "in_progress", "done"].map((s) => ({
    name: statusLabels[s],
    value: allTasks.filter((t) => t.status === s).length,
  }));

  const priorityLabels: Record<string, string> = { low: "Low", medium: "Medium", high: "High" };
  const priorityData = ["low", "medium", "high"].map((p) => ({
    name: priorityLabels[p],
    value: allTasks.filter((t) => t.priority === p).length,
  }));

  const days: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const count = allTasks.filter(
      (t) => t.status === "done" && t.updatedAt >= d && t.updatedAt < next
    ).length;
    days.push({ date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), count });
  }

  const doneByMember = new Map<string, { name: string; value: number }>();
  for (const t of allTasks) {
    if (t.status !== "done" || !t.assigneeId) continue;
    const member = organization.members.find((m) => m.userId === t.assigneeId);
    const name = member?.user?.name || "Unknown";
    const entry = doneByMember.get(t.assigneeId) || { name, value: 0 };
    entry.value += 1;
    doneByMember.set(t.assigneeId, entry);
  }
  const leaderboardData = Array.from(doneByMember.values()).sort((a, b) => b.value - a.value).slice(0, 8);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Everything you need to know about {organization.name}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
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

        <div className="bg-card p-6 rounded-3xl border shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Overdue</span>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
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

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card p-6 rounded-3xl border shadow-sm">
          <h2 className="font-semibold text-sm mb-4">Task Status</h2>
          <StatusDonut data={statusData} />
        </div>
        <div className="bg-card p-6 rounded-3xl border shadow-sm">
          <h2 className="font-semibold text-sm mb-4">Task Priority</h2>
          <PriorityBar data={priorityData} />
        </div>
        <div className="bg-card p-6 rounded-3xl border shadow-sm">
          <h2 className="font-semibold text-sm mb-4">Completed Tasks (Last 30 Days)</h2>
          <CompletionLine data={days} />
        </div>
        <div className="bg-card p-6 rounded-3xl border shadow-sm">
          <h2 className="font-semibold text-sm mb-4">Top Contributors</h2>
          <MemberLeaderboard data={leaderboardData} />
        </div>
      </div>
    </div>
  );
}
