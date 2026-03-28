"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getGitHubRepos } from "@/server/github";

export default function GitHubTestPage() {
  const [username, setUsername] = useState("");
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!username.trim()) return;
    
    setLoading(true);
    setError("");
    setRepos([]);
    
    const data = await getGitHubRepos(username);
    
    if (data && data.length > 0) {
      setRepos(data);
    } else if (data && data.length === 0) {
      setError("This user has no public repositories.");
    } else {
      setError("User not found or API rate limit exceeded.");
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-3xl font-bold">GitHub Integration Test</h1>
      
      {/* Search Bar */}
      <div className="flex gap-2">
        <Input 
          placeholder="Enter GitHub username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {error && <p className="text-destructive font-medium">{error}</p>}

      <div className="space-y-4">
        {repos.map((repo) => (
          <div key={repo.id} className="p-4 border rounded-xl bg-card transition-colors hover:bg-muted/50">
            <div className="flex justify-between items-start">
              <a 
                href={repo.html_url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-lg font-semibold hover:underline text-primary"
              >
                {repo.name}
              </a>
              <div className="flex gap-3 text-sm font-medium">
                <span>⭐ {repo.stargazers_count}</span>
                <span>🍴 {repo.forks_count}</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mt-2">
              {repo.description || "No description provided."}
            </p>

            {repo.lastCommit && (
              <div className="mt-4 p-3 bg-muted/40 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-1 font-medium tracking-wide uppercase">
                  Latest Commit
                </p>
                <a 
                  href={repo.lastCommit.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-sm font-medium hover:underline block truncate mb-1"
                >
                  {repo.lastCommit.message}
                </a>
                <p className="text-xs text-muted-foreground">
                  {new Date(repo.lastCommit.date).toLocaleString()}
                </p>
              </div>
            )}
            
          </div>
        ))}
      </div>
    </div>
  );
}