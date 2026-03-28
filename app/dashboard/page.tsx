import { Button } from "../../components/ui/button"; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CreateOrganizationForm } from "@/components/forms/create-organization-form";
import { Logout } from "@/components/ui/logout";
import { getOrganizations, getPendingInvitations } from "@/server/organizations"; 
import Link from "next/link";
import { headers } from "next/headers"; 
import { auth } from "@/lib/auth"; 
import { redirect } from "next/navigation"; 
import { PendingInvitations } from "@/components/pending-invitations"; 

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(), 
  });

  if (!session?.user) {
    redirect("/login");
  }

  const organizations = await getOrganizations();
  const pendingInvites = await getPendingInvitations(session.user.email);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-10">
      
      <Logout />

      <div className="w-full max-w-2xl">
        <PendingInvitations initialInvites={pendingInvites} />
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Create Organization</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to get started.
            </DialogDescription>
          </DialogHeader>
          <CreateOrganizationForm />
        </DialogContent>
      </Dialog>
      
      <div className="flex flex-col gap-2 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-2">Organizations</h2>
        {organizations.map((organization) => (
        <Button variant="outline" key={organization.id} asChild>
          <Link href={`/dashboard/organization/${organization.slug}`}>
            {organization.name}
          </Link>
        </Button>
        ))}
      </div>

    </div>
  );
}