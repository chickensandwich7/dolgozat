import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 flex flex-col gap-6 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight">
        Welcome back, {session.user.name}!
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        Select an organization from the navigation bar above to manage your projects, 
        or create a new one to get started.
      </p>
    </div>
  );
}