import { getOrganizationBySlug } from "@/server/organizations";

type Params = Promise<{ slug: string }>;

export default async function OrganizationHomePage({ params }: { params: Params }) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-10">
      <div>
        <h1 className="text-3xl font-bold">Welcome to {organization?.name}!</h1>
        <p className="text-muted-foreground mt-2">
          This is your dashboard home. Soon, you will be able to manage your GitHub repositories and projects from here.
        </p>
      </div>
      <div className="mt-8 p-12 border-2 border-dashed border-primary/20 rounded-xl flex flex-col items-center justify-center text-center bg-card/50">
        <h3 className="text-lg font-semibold text-primary/80 mb-2">No projects yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          We are currently setting up the database. You will be able to link GitHub repositories here very soon!
        </p>
      </div>
    </div>
  );
}