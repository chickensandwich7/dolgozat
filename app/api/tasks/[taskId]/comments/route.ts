import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { task, taskComment, notification } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, asc } from "drizzle-orm";
import { organization as organizationTable } from "@/db/schema";
import { logActivity } from "@/server/activity";

async function getTaskAndMembership(taskId: string, userId: string) {
  const existingTasks = await db.select().from(task).where(eq(task.id, taskId));
  const currentTask = existingTasks[0];
  if (!currentTask) return { currentTask: null, currentMember: null };

  const organization = await db.query.organization.findFirst({
    where: eq(organizationTable.id, currentTask.organizationId),
    with: { members: { with: { user: true } } },
  });
  const currentMember = organization?.members.find((m) => m.userId === userId);
  return { currentTask, currentMember };
}

export async function GET(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { currentMember } = await getTaskAndMembership(taskId, session.user.id);
    if (!currentMember) return new NextResponse("Forbidden", { status: 403 });

    const comments = await db.query.taskComment.findMany({
      where: eq(taskComment.taskId, taskId),
      with: { author: true },
      orderBy: asc(taskComment.createdAt),
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("[TASK_COMMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { body } = await req.json();
    if (!body || typeof body !== "string" || !body.trim()) {
      return new NextResponse("Comment body is required", { status: 400 });
    }

    const { currentTask, currentMember } = await getTaskAndMembership(taskId, session.user.id);
    if (!currentTask || !currentMember) return new NextResponse("Forbidden", { status: 403 });

    const inserted = await db.insert(taskComment).values({
      id: crypto.randomUUID(),
      taskId,
      authorId: session.user.id,
      body: body.trim(),
    }).returning();

    await logActivity(taskId, session.user.id, "commented");

    if (currentTask.assigneeId && currentTask.assigneeId !== session.user.id) {
      await db.insert(notification).values({
        id: crypto.randomUUID(),
        userId: currentTask.assigneeId,
        organizationId: currentTask.organizationId,
        type: "task_comment",
        title: "New Comment",
        message: `${session.user.name || "Someone"} commented on "${currentTask.title}".`,
      });
    }

    const withAuthor = await db.query.taskComment.findFirst({
      where: eq(taskComment.id, inserted[0].id),
      with: { author: true },
    });

    return NextResponse.json(withAuthor);
  } catch (error) {
    console.error("[TASK_COMMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
