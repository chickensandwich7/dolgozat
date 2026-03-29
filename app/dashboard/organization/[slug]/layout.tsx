import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrganizationBySlug } from "@/server/organizations";

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const organization = await getOrganizationBySlug(slug);
  if (!organization) redirect("/dashboard");

  const currentMember = organization.members.find(
    (m: any) => m.userId === session.user.id
  );

  if (!currentMember) redirect("/dashboard");

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 p-6 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}