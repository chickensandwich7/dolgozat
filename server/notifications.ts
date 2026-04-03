import { db } from "@/db/drizzle";
import { notification, task } from "@/db/schema";
import { and, eq, lte, gte, isNull } from "drizzle-orm";

export async function checkDeadlines(userId: string, organizationId: string, slug: string) {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);

  const upcomingTasks = await db.select().from(task).where(
    and(
      eq(task.assigneeId, userId),
      eq(task.organizationId, organizationId),
      lte(task.dueDate, tomorrow),
      eq(task.status, "todo") 
    )
  );

  for (const t of upcomingTasks) {
    const existing = await db.select().from(notification).where(
      and(
        eq(notification.userId, userId),
        eq(notification.type, "task_deadline"),
        eq(notification.title, `Deadline Approaching: ${t.title}`)
      )
    );

    if (existing.length === 0) {
      await db.insert(notification).values({
        id: crypto.randomUUID(),
        userId: userId,
        organizationId: organizationId,
        type: "task_deadline",
        title: `Deadline Approaching: ${t.title}`,
        message: `This task is due very soon (${t.dueDate?.toLocaleDateString()}).`,
        actionLink: `/dashboard/organization/${slug}/tasks`,
      });
    }
  }
}