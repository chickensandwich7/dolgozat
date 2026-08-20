import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/forms/settings-form"; 
import { db } from "@/db/drizzle"; 
import { account } from "@/db/schema"; 
import { eq } from "drizzle-orm";

export default async function GlobalSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/");
  }
  const userAccounts = await db.query.account.findMany({
    where: eq(account.userId, session.user.id)
  });
  
  // Lekérdezzük mindkét szolgáltatót
  const hasGithub = userAccounts.some((acc) => acc.providerId === "github");
  const hasGitlab = userAccounts.some((acc) => acc.providerId === "gitlab");

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your personal profile.</p>
      </div>

      <SettingsForm 
        user={session.user} 
        initialHasGithubLinked={hasGithub} 
        initialHasGitlabLinked={hasGitlab} 
      />
    </div>
  );
}