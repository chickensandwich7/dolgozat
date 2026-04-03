import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getOrganizations, getPendingInvitations } from "@/server/organizations";
import { SidebarUI } from "./sidebar-ui";
import { db } from "@/db/drizzle";
import { notification } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function AppSidebar() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  
  if (!user) return null;

  const organizations = await getOrganizations();
  const pendingInvites = await getPendingInvitations(user.email);
  const initials = user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U";

  const unreadData = await db
    .select()
    .from(notification)
    .where(
      and(
        eq(notification.userId, user.id),
        eq(notification.isRead, false)
      )
    );
  
  const unreadCount = unreadData.length + pendingInvites.length;

  return (
    <SidebarUI 
      organizations={organizations}
      pendingInvites={pendingInvites}
      user={user}
      initials={initials}
      unreadCount={unreadCount} 
    />
  );
}