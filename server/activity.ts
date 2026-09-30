"use server";

import { db } from "@/db/drizzle";
import { taskActivity } from "@/db/schema";

export async function logActivity(
  taskId: string,
  actorId: string,
  action: string,
  meta?: Record<string, unknown>
) {
  await db.insert(taskActivity).values({
    id: crypto.randomUUID(),
    taskId,
    actorId,
    action,
    meta: meta ? JSON.stringify(meta) : null,
  });
}
