import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { organization } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getOrganizationBySlug } from "@/server/organizations";

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) return new NextResponse("Missing slug", { status: 400 });

    const org = await getOrganizationBySlug(slug);
    if (!org) return new NextResponse("Organization not found", { status: 404 });

    const currentMember = org.members.find((m: any) => m.userId === session.user.id);
    if (currentMember?.role !== "owner") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await db.delete(organization).where(eq(organization.id, org.id));
    
    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    console.error("DELETE_ORG_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}