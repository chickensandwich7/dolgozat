import { getOrganizationBySlug } from "@/server/organizations";
import { db } from "@/db/drizzle";
import { project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GitCommit, ExternalLink, ChevronLeft, ChevronRight, Github, Gitlab } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers"; 
import { Button } from "@/components/ui/button";

export default async function CommitsPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  
  const resolvedSearchParams = await searchParams;
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const perPage = 10; 

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
                  You need to link a repository in the settings to see the commit history here.
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
                An administrator needs to link a repository in the settings before you can view the commit history.
              </p>
            )}
         </div>
      </div>
    );
  }


  let provider = "github";
  let repoPath = activeProject.githubRepo;

  if (activeProject.githubRepo.includes("|")) {
    const parts = activeProject.githubRepo.split("|");
    provider = parts[0];
    repoPath = parts[1];
  }

  let rawCommits: any[] = [];
  let normalizedCommits: any[] = [];

  try {
    if (provider === "gitlab") {
      const encodedPath = encodeURIComponent(repoPath);
      const res = await fetch(`https://gitlab.com/api/v4/projects/${encodedPath}/repository/commits?per_page=${perPage}&page=${currentPage}`, {
        next: { revalidate: 60 } 
      });
      
      if (res.ok) {
        rawCommits = await res.json();
        normalizedCommits = rawCommits.map((c: any) => ({
          sha: c.id,
          message: c.title || c.message,
          authorName: c.author_name,
          date: c.created_at,
          url: c.web_url || `https://gitlab.com/${repoPath}/-/commit/${c.id}`
        }));
      }
    } else {
      const res = await fetch(`https://api.github.com/repos/${repoPath}/commits?per_page=${perPage}&page=${currentPage}`, {
        next: { revalidate: 60 } 
      });
      
      if (res.ok) {
        rawCommits = await res.json();
        normalizedCommits = rawCommits.map((c: any) => ({
          sha: c.sha,
          message: c.commit.message,
          authorName: c.commit.author.name,
          date: c.commit.author.date,
          url: c.html_url
        }));
      }
    }
  } catch (error) {
    console.error(`Failed to fetch commits from ${provider}`, error);
  }

  const hasNextPage = rawCommits.length === perPage;

  return (
    <div className="max-w-4xl mx-auto py-10 flex flex-col min-h-[calc(100vh-100px)]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Commits</h1>
          <div className="flex items-center gap-2 mt-1">
            {provider === "gitlab" ? (
              <Gitlab className="w-4 h-4 text-orange-500" />
            ) : (
              <Github className="w-4 h-4 text-foreground" />
            )}
            <p className="text-sm text-muted-foreground">
              Showing commits from <span className="font-semibold text-foreground">{repoPath}</span> (Page {currentPage})
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        {normalizedCommits.length === 0 ? (
           <p className="text-muted-foreground text-center py-10 bg-card border rounded-xl">
             No commits found on this page, or API limit reached. Try again later!
           </p>
        ) : (
          normalizedCommits.map((commit: any) => (
            <div key={commit.sha} className="bg-card border rounded-xl p-4 flex gap-4 items-start hover:border-primary/50 transition-colors group">
              <div className="bg-primary/10 p-2 rounded-full shrink-0 mt-1">
                <GitCommit className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {commit.message.split('\n')[0]}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground/80">{commit.authorName}</span>
                  <span>•</span>
                  <span>{new Date(commit.date).toLocaleString()}</span>
                </div>
              </div>
              <a 
                href={commit.url} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors shrink-0 bg-accent px-2 py-1 rounded opacity-0 group-hover:opacity-100"
              >
                {commit.sha.substring(0, 7)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between mt-8 pt-4 border-t">
        <Button 
          variant="outline" 
          disabled={currentPage === 1}
          asChild={currentPage > 1}
        >
          {currentPage > 1 ? (
            <Link href={`/dashboard/organization/${slug}/commits?page=${currentPage - 1}`}>
              <ChevronLeft className="h-4 w-4 mr-2" /> Previous
            </Link>
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" /> Previous
            </>
          )}
        </Button>
        
        <div className="text-sm font-medium text-muted-foreground bg-muted px-4 py-1.5 rounded-full">
          Page {currentPage}
        </div>

        <Button 
          variant="outline" 
          disabled={!hasNextPage}
          asChild={hasNextPage}
        >
          {hasNextPage ? (
            <Link href={`/dashboard/organization/${slug}/commits?page=${currentPage + 1}`}>
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          ) : (
            <>
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

    </div>
  );
}