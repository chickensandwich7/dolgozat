import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { task, taskActivity, organization as organizationTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, asc } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const existingTasks = await db.select().from(task).where(eq(task.id, taskId));
    const currentTask = existingTasks[0];
    if (!currentTask) return new NextResponse("Task not found", { status: 404 });

    const organization = await db.query.organization.findFirst({
      where: eq(organizationTable.id, currentTask.organizationId),
      with: { members: true },
    });
    const currentMember = organization?.members.find((m) => m.userId === session.user.id);
    if (!currentMember) return new NextResponse("Forbidden", { status: 403 });

    const activity = await db.query.taskActivity.findMany({
      where: eq(taskActivity.taskId, taskId),
      with: { actor: true },
      orderBy: asc(taskActivity.createdAt),
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error("[TASK_ACTIVITY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
