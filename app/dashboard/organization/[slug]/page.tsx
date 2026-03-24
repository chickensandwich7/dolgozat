import { getActiveOrganization } from "@/server/organizations";

export default async function OrganizationPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const organization = await getActiveOrganization(slug);

    return<div>{organization?.name}</div>
}
   