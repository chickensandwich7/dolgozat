import { getOrganizationBySlug } from "@/server/organizations";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GitBranch } from "lucide-react";
import { AddProjectButton } from "@/components/add-project-button";
import { ProjectCard } from "@/components/project-card";
import { DeleteOrganizationZone } from "@/components/ui/delete-organization-zone";
import { db } from "@/db/drizzle";
import { project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { canManageOrg } from "@/lib/auth/roles";

export default async function OrganizationSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);

  if (!organization) redirect("/dashboard");

  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserMember = organization.members.find(
    (m: any) => m.userId === session?.user?.id
  );

  const role = currentUserMember?.role;
  if (!canManageOrg(role)) {
    redirect(`/dashboard/organization/${slug}`);
  }

  const linkedProjects = await db.select().from(project).where(eq(project.organizationId, organization.id));

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Organization Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your organization preferences and link external services.
        </p>
      </div>

      <div className="bg-card border rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-md">
              <GitBranch className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Projects</h2>
              <p className="text-sm text-muted-foreground">
                Connect GitHub or GitLab repositories to track commits and tasks per project.
              </p>
            </div>
          </div>
          <AddProjectButton slug={slug} />
        </div>

        {linkedProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg">
            No projects yet. Add one to start tracking tasks and commits.
          </p>
        ) : (
          <div className="space-y-3">
            {linkedProjects.map((p) => (
              <ProjectCard key={p.id} project={p} slug={slug} />
            ))}
          </div>
        )}
      </div>

      {role === "owner" && (
        <DeleteOrganizationZone slug={slug} />
      )}

    </div>
  );
}