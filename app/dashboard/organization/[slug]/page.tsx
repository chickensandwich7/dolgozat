import MembersTable from "@/components/members-table";
import { getOrganizationBySlug } from "@/server/organizations";
import { InviteUser } from "@/components/invite-user"; 
import { headers } from "next/headers"; // Session lekéréshez
import { auth } from "@/lib/auth"; // Session lekéréshez

type Params = Promise<{ slug: string }>;

export default async function OrganizationPage({ params }: { params: Params }) {
  const { slug } = await params;

  // 1. Lekérjük a szervezetet és a tagjait
  const organization = await getOrganizationBySlug(slug);

  // 2. Lekérjük az éppen bejelentkezett usert
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 3. Megkeressük a jelenlegi usert a tagok között, hogy megtudjuk a rangját
  const currentUserMember = organization?.members.find(
    (m: any) => m.userId === session?.user?.id
  );

  // 4. Eldöntjük, hogy van-e joga meghívni (owner vagy admin)
  const canInvite = currentUserMember?.role === "owner" || currentUserMember?.role === "admin";

  return(
    <div className="flex flex-col gap-4 max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold">{organization?.name}</h1>
      
      {/* 5. Csak akkor rendereljük a meghívót, ha létezik a szervezet ÉS van joga hozzá */}
      {organization && canInvite && (
         <div className="bg-card p-4 rounded-xl border mb-4">
            <InviteUser activeOrganizationId={organization.id} />
         </div>
      )}

      <MembersTable members={organization?.members || []}/>
    </div>
  );
}