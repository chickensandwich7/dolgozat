import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { task, notification } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrganizationBySlug } from "@/server/organizations";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) return new NextResponse("Missing slug", { status: 400 });

    const organization = await getOrganizationBySlug(slug);
    if (!organization) return new NextResponse("Organization not found", { status: 404 });

    const tasks = await db.select().from(task).where(eq(task.organizationId, organization.id));
    return NextResponse.json(tasks);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { title, description, assigneeId, priority, dueDate, slug } = body;

    const organization = await getOrganizationBySlug(slug);
    if (!organization) return new NextResponse("Organization not found", { status: 404 });

    const currentMember = organization.members.find((m: any) => m.userId === session.user.id);
    if (!currentMember || (currentMember.role !== "owner" && currentMember.role !== "admin")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const newTask = await db.insert(task).values({
      id: crypto.randomUUID(),
      title,
      description,
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId: assigneeId || null,
      organizationId: organization.id,
      createdById: session.user.id,
    }).returning();

    if (assigneeId && assigneeId !== session.user.id) {
      await db.insert(notification).values({
        id: crypto.randomUUID(),
        userId: assigneeId,
        organizationId: organization.id,
        type: "task_assigned",
        title: "New Task Assigned",
        message: `You have been assigned a new task: "${title}"`,
        actionLink: `/dashboard/organization/${slug}/tasks`,
      });
    }

    return NextResponse.json(newTask[0]);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { taskId, status, githubCommitLink, title, description, assigneeId, priority, dueDate, slug } = body;

    const organization = await getOrganizationBySlug(slug);
    if (!organization) return new NextResponse("Organization not found", { status: 404 });

    const currentMember = organization.members.find((m: any) => m.userId === session.user.id);
    if (!currentMember) return new NextResponse("Forbidden", { status: 403 });

    const existingTasks = await db.select().from(task).where(eq(task.id, taskId));
    const currentTask = existingTasks[0];
    if (!currentTask) return new NextResponse("Task not found", { status: 404 });

    const isAdminOrOwner = currentMember.role === "owner" || currentMember.role === "admin";
    
    if ((title !== undefined || description !== undefined || priority !== undefined || dueDate !== undefined) && !isAdminOrOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (!isAdminOrOwner && currentTask.assigneeId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updatedTask = await db.update(task)
      .set({ 
        status: status !== undefined ? status : currentTask.status,
        githubCommitLink: githubCommitLink !== undefined ? githubCommitLink : currentTask.githubCommitLink,
        title: title !== undefined ? title : currentTask.title,
        description: description !== undefined ? description : currentTask.description,
        priority: priority !== undefined ? priority : currentTask.priority,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : currentTask.dueDate,
        assigneeId: assigneeId !== undefined ? (assigneeId === "unassigned" ? null : assigneeId) : currentTask.assigneeId,
      })
      .where(eq(task.id, taskId))
      .returning();

    if (status === "done" && currentTask.status !== "done") {
      const admins = organization.members.filter((m: any) => m.role === "admin" || m.role === "owner");
      
      for (const admin of admins) {
        if (admin.userId !== session.user.id) {
          await db.insert(notification).values({
            id: crypto.randomUUID(),
            userId: admin.userId,
            organizationId: organization.id,
            type: "task_completed",
            title: "Task Completed",
            message: `Task "${currentTask.title}" has been moved to Done by ${session.user.name || "a team member"}.`,
            actionLink: `/dashboard/organization/${slug}/tasks`,
          });
        }
      }
    }

    return NextResponse.json(updatedTask[0]);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    const slug = searchParams.get("slug");

    if (!taskId || !slug) return new NextResponse("Missing parameters", { status: 400 });

    const organization = await getOrganizationBySlug(slug);
    if (!organization) return new NextResponse("Organization not found", { status: 404 });

    const currentMember = organization.members.find((m: any) => m.userId === session.user.id);
    if (!currentMember || (currentMember.role !== "owner" && currentMember.role !== "admin")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await db.delete(task).where(eq(task.id, taskId));
    
    return new NextResponse("Task deleted", { status: 200 });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}