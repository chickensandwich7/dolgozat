import { getOrganizationBySlug } from "@/server/organizations";
import { db } from "@/db/drizzle";
import { task, project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { KanbanBoard } from "@/components/kanban-board";

export default async function TasksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);

  if (!organization) redirect("/dashboard");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const currentUserMember = organization.members.find(
    (m: any) => m.userId === session.user.id
  );

  if (!currentUserMember) redirect(`/dashboard`);

  const isAdminOrOwner = currentUserMember.role === "owner" || currentUserMember.role === "admin";

  const initialTasks = await db.select().from(task).where(eq(task.organizationId, organization.id));

  const projectData = await db.select().from(project).where(eq(project.organizationId, organization.id));
  const githubRepo = projectData.length > 0 ? projectData[0].githubRepo : null;

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))]">
      <div className="p-6 border-b bg-card shrink-0">
        <h1 className="text-2xl font-bold">Project Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your team's workflow and track progress.
        </p>
      </div>

      <div className="flex-1 overflow-x-auto bg-muted/30">
         <KanbanBoard
           initialTasks={initialTasks}
           members={organization.members}
           currentUser={session.user}
           isAdmin={isAdminOrOwner}
           slug={slug}
           githubRepo={githubRepo} 
         />
      </div>
    </div>
  );
}