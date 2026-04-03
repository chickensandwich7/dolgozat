import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getPendingInvitations } from "@/server/organizations";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const invites = await getPendingInvitations(session.user.email);
    return NextResponse.json(invites);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}