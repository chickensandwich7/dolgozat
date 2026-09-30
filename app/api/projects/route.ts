import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { project } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrganizationBySlug } from "@/server/organizations";
import { eq } from "drizzle-orm";
import { canManageOrg } from "@/lib/auth/roles";

function normalizeRepo(githubRepo: string) {
  let provider = "github";
  let rawPath = githubRepo;

  if (githubRepo.includes("|")) {
    const parts = githubRepo.split("|");
    provider = parts[0];
    rawPath = parts[1];
  }

  let cleanRepoPath = rawPath;
  if (cleanRepoPath.includes("github.com/")) cleanRepoPath = cleanRepoPath.split("github.com/")[1].trim();
  if (cleanRepoPath.includes("gitlab.com/")) cleanRepoPath = cleanRepoPath.split("gitlab.com/")[1].trim();
  cleanRepoPath = cleanRepoPath.replace(/\/$/, "").replace(/\.git$/, "");

  return `${provider}|${cleanRepoPath}`;
}

async function requireOrgManager(slug: string, userId: string) {
  const organization = await getOrganizationBySlug(slug);
  if (!organization) return { error: new NextResponse("Organization not found", { status: 404 }) };

  const currentMember = organization.members.find((m: any) => m.userId === userId);
  if (!currentMember || !canManageOrg(currentMember.role)) {
    return { error: new NextResponse("Forbidden", { status: 403 }) };
  }

  return { organization };
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) return new NextResponse("Missing slug", { status: 400 });

    const organization = await getOrganizationBySlug(slug);
    if (!organization) return new NextResponse("Organization not found", { status: 404 });

    const currentMember = organization.members.find((m: any) => m.userId === session.user.id);
    if (!currentMember) return new NextResponse("Forbidden", { status: 403 });

    const projects = await db.select().from(project).where(eq(project.organizationId, organization.id));
    return NextResponse.json(projects);
  } catch (error) {
    console.error("[PROJECTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { name, githubRepo, slug } = await req.json();
    if (!name || !githubRepo || !slug) return new NextResponse("Missing fields", { status: 400 });

    const { organization, error } = await requireOrgManager(slug, session.user.id);
    if (error) return error;

    const newProject = await db.insert(project).values({
      id: crypto.randomUUID(),
      name,
      githubRepo: normalizeRepo(githubRepo),
      organizationId: organization!.id,
    }).returning();

    return NextResponse.json(newProject[0]);
  } catch (error) {
    console.error("[PROJECTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { projectId, name, githubRepo, slug } = await req.json();
    if (!projectId || !slug) return new NextResponse("Missing fields", { status: 400 });

    const { error } = await requireOrgManager(slug, session.user.id);
    if (error) return error;

    const updated = await db.update(project)
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(githubRepo !== undefined ? { githubRepo: normalizeRepo(githubRepo) } : {}),
      })
      .where(eq(project.id, projectId))
      .returning();

    if (!updated[0]) return new NextResponse("Project not found", { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("[PROJECTS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const slug = searchParams.get("slug");
    if (!projectId || !slug) return new NextResponse("Missing parameters", { status: 400 });

    const { error } = await requireOrgManager(slug, session.user.id);
    if (error) return error;

    await db.delete(project).where(eq(project.id, projectId));
    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    console.error("[PROJECTS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
