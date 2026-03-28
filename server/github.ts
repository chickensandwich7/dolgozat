"use server";

export async function getGitHubRepos(username: string) {
  try {
    const repoResponse = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=5`,
      {
        headers: { Accept: "application/vnd.github.v3+json" },
      }
    );

    if (!repoResponse.ok) {
      throw new Error(`GitHub API Error: ${repoResponse.status}`);
    }

    const repos = await repoResponse.json();

    const reposWithCommits = await Promise.all(
      repos.map(async (repo: any) => {
        try {
          const commitResponse = await fetch(
            `https://api.github.com/repos/${username}/${repo.name}/commits?per_page=1`,
            { headers: { Accept: "application/vnd.github.v3+json" } }
          );

          if (commitResponse.ok) {
            const commits = await commitResponse.json();
            if (commits && commits.length > 0) {
              repo.lastCommit = {
                message: commits[0].commit.message,
                date: commits[0].commit.author.date,
                url: commits[0].html_url,
              };
            }
          }
        } catch (err) {
          console.error(`Error fetching commit for ${repo.name}`, err);
        }
        return repo;
      })
    );

    return reposWithCommits;
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return null;
  }
}