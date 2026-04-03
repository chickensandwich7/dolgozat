import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { notification } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const data = await db
      .select()
      .from(notification)
      .where(eq(notification.userId, session.user.id))
      .orderBy(desc(notification.createdAt));

    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { notificationId, all } = body;

    if (all) {
      await db
        .update(notification)
        .set({ isRead: true })
        .where(eq(notification.userId, session.user.id));
    } else if (notificationId) {
      await db
        .update(notification)
        .set({ isRead: true })
        .where(
          and(
            eq(notification.id, notificationId),
            eq(notification.userId, session.user.id)
          )
        );
    }

    return new NextResponse("Updated", { status: 200 });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    if (all === "true") {
      await db.delete(notification).where(eq(notification.userId, session.user.id));
    } else if (id) {
      await db.delete(notification).where(
        and(
          eq(notification.id, id),
          eq(notification.userId, session.user.id)
        )
      );
    }

    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}