import MembersTable from "@/components/members-table";
import { getOrganizationBySlug } from "@/server/organizations";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

type Params = Promise<{ slug: string }>;

export default async function OrganizationMembersPage({ params }: { params: Params }) {
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

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto py-10">
      <div>
        <h1 className="text-2xl font-bold">Organization Members</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your team members and their roles here.
        </p>
      </div>
      
      <div className="mt-6">
        <MembersTable members={organization.members || []} />
      </div>
    </div>
  );
}