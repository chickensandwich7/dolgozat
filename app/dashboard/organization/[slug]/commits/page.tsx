import { getOrganizationBySlug } from "@/server/organizations";
import { db } from "@/db/drizzle";
import { project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GitCommit, ExternalLink } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers"; 

export default async function CommitsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);

  if (!organization) return <div>Organization not found</div>;


  const session = await auth.api.getSession({ headers: await headers() });
  const currentMember = organization.members.find(
    (m: any) => m.userId === session?.user?.id
  );
  const isAdminOrOwner = currentMember?.role === "owner" || currentMember?.role === "admin";


  const linkedProjects = await db.select().from(project).where(eq(project.organizationId, organization.id));
  const activeProject = linkedProjects[0];


  if (!activeProject) {
    return (
      <div className="max-w-4xl mx-auto py-10">
         <h1 className="text-2xl font-bold mb-6">Project Commits</h1>
         <div className="bg-card border border-dashed rounded-xl p-10 text-center flex flex-col items-center">
            <GitCommit className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-lg font-semibold mb-2">No repository linked</h2>
            

            {isAdminOrOwner ? (
              <>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  You need to link a GitHub repository in the settings to see the commit history here.
                </p>
                <Link 
                  href={`/dashboard/organization/${slug}/settings`} 
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
                >
                  Go to Settings
                </Link>
              </>
            ) : (
              <p className="text-muted-foreground max-w-sm">
                An administrator needs to link a GitHub repository in the settings before you can view the commit history.
              </p>
            )}

         </div>
      </div>
    );
  }

  let commits = [];
  try {
    const res = await fetch(`https://api.github.com/repos/${activeProject.githubRepo}/commits`, {
      next: { revalidate: 60 } 
    });
    
    if (res.ok) {
      commits = await res.json();
    }
  } catch (error) {
    console.error("Failed to fetch commits from GitHub", error);
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Commits</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Showing the latest commits from <span className="font-semibold text-foreground">{activeProject.githubRepo}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {commits.length === 0 ? (
           <p className="text-muted-foreground text-center py-10 bg-card border rounded-xl">
             No commits found, or GitHub API limit reached. Try again later!
           </p>
        ) : (
          commits.slice(0, 30).map((commitItem: any) => (
            <div key={commitItem.sha} className="bg-card border rounded-xl p-4 flex gap-4 items-start hover:border-primary/50 transition-colors group">
              <div className="bg-primary/10 p-2 rounded-full shrink-0 mt-1">
                <GitCommit className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {commitItem.commit.message.split('\n')[0]}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground/80">{commitItem.commit.author.name}</span>
                  <span>•</span>
                  <span>{new Date(commitItem.commit.author.date).toLocaleString()}</span>
                </div>
              </div>
              <a 
                href={commitItem.html_url} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors shrink-0 bg-accent px-2 py-1 rounded opacity-0 group-hover:opacity-100"
              >
                {commitItem.sha.substring(0, 7)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}