import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { member } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getOrganizationBySlug } from "@/server/organizations";
import { ROLES } from "@/lib/auth/roles";

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { memberId, newRole, slug } = body;

    if (!memberId || !newRole || !slug) return new NextResponse("Missing parameters", { status: 400 });
    if (!ROLES.includes(newRole)) return new NextResponse("Invalid role", { status: 400 });

    const organization = await getOrganizationBySlug(slug);
    if (!organization) return new NextResponse("Organization not found", { status: 404 });

    const currentMember = organization.members.find((m: any) => m.userId === session.user.id);
    if (!currentMember || (currentMember.role !== "owner" && currentMember.role !== "admin")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const targetMember = organization.members.find((m: any) => m.id === memberId);
    if (!targetMember) return new NextResponse("Member not found", { status: 404 });

    if (currentMember.role === "admin") {
      if (targetMember.role === "owner" || targetMember.role === "admin") {
        return new NextResponse("Admins cannot change the role of an owner or another admin", { status: 403 });
      }
      if (newRole === "owner" || newRole === "admin") {
        return new NextResponse("Admins cannot grant owner or admin roles", { status: 403 });
      }
    }

    if (targetMember.role === "owner" && newRole !== "owner") {
      const ownerCount = organization.members.filter((m: any) => m.role === "owner").length;
      if (ownerCount <= 1) {
        return new NextResponse("Cannot demote the only owner of the organization", { status: 403 });
      }
    }

    const updated = await db.update(member)
      .set({ role: newRole })
      .where(eq(member.id, memberId))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("[MEMBERS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
