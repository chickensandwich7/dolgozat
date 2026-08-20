import { getOrganizationBySlug } from "@/server/organizations";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GitBranch } from "lucide-react";
import { RepoSettingsForm } from "@/components/repo-settings-form";
import { DeleteOrganizationZone } from "@/components/ui/delete-organization-zone"; 
import { db } from "@/db/drizzle";
import { project } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function OrganizationSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);

  if (!organization) redirect("/dashboard");

  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserMember = organization.members.find(
    (m: any) => m.userId === session?.user?.id
  );

  const role = currentUserMember?.role;
  if (role !== "owner" && role !== "admin") {
    redirect(`/dashboard/organization/${slug}`);
  }

  const linkedProjects = await db.select().from(project).where(eq(project.organizationId, organization.id));
  const currentProject = linkedProjects[0] || null;

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Organization Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your organization preferences and link external services.
        </p>
      </div>

      <div className="bg-card border rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-2 rounded-md">
            <GitBranch className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Link Repository</h2>
            <p className="text-sm text-muted-foreground">
              Connect a GitHub or GitLab repository to track commits and project data.
            </p>
          </div>
        </div>

        <RepoSettingsForm slug={slug} initialProject={currentProject} />
      </div>

      {role === "owner" && (
        <DeleteOrganizationZone slug={slug} />
      )}

    </div>
  );
}