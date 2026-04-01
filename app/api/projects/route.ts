import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { project } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrganizationBySlug } from "@/server/organizations";
import { eq } from "drizzle-orm"; 

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { name, githubRepo, slug } = await req.json();
    if (!name || !githubRepo || !slug) return new NextResponse("Missing fields", { status: 400 });

    const organization = await getOrganizationBySlug(slug);
    if (!organization) return new NextResponse("Organization not found", { status: 404 });

    const currentMember = organization.members.find((m: any) => m.userId === session.user.id);
    if (!currentMember || (currentMember.role !== "owner" && currentMember.role !== "admin")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    let cleanRepoPath = githubRepo;
    if (githubRepo.includes("github.com/")) cleanRepoPath = githubRepo.split("github.com/")[1].trim();
    cleanRepoPath = cleanRepoPath.replace(/\/$/, "").replace(/\.git$/, "");

    const existingProjects = await db.select().from(project).where(eq(project.organizationId, organization.id));

    if (existingProjects.length > 0) {
      const updatedProject = await db.update(project)
        .set({ name: name, githubRepo: cleanRepoPath })
        .where(eq(project.id, existingProjects[0].id))
        .returning();
      return NextResponse.json(updatedProject[0]);
    } else {
      const newProject = await db.insert(project).values({
        id: crypto.randomUUID(),
        name: name,
        githubRepo: cleanRepoPath,
        organizationId: organization.id,
      }).returning();
      return NextResponse.json(newProject[0]);
    }

  } catch (error) {
    console.error("[PROJECTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}