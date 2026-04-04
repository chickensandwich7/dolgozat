import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { name, image } = body;

    if (!name) return new NextResponse("Name is required", { status: 400 });

    await db.update(user)
      .set({ 
        name, 
        image: image || null
      })
      .where(eq(user.id, session.user.id));

    return new NextResponse("Profile updated successfully", { status: 200 });
  } catch (error) {
    console.error("USER_UPDATE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}