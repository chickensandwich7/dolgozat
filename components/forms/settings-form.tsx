"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Loader2, Save, CheckCircle2, Github, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadButton } from "@/lib/uploadthing";
import { authClient } from "@/lib/auth-client";


export function SettingsForm({ user, initialHasGithubLinked }: { user: any, initialHasGithubLinked: boolean }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  
  const [name, setName] = useState(user?.name || "");
  const [image, setImage] = useState(user?.image || "");
  const initials = user?.name?.substring(0, 2).toUpperCase() || "U";
  

  const [isGithubLinked, setIsGithubLinked] = useState(initialHasGithubLinked); 

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const isConfirmed = window.confirm("Are you sure you want to save these changes to your profile?");
    if (!isConfirmed) return; 

    setIsLoading(true);
    setIsSuccess(false);

    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image }),
      });

      if (res.ok) {
        setIsSuccess(true);
        router.refresh(); 
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkGithub = async () => {
    setIsGithubLoading(true);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard/settings", 
      });
    } catch (error) {
      console.error("Hiba a GitHub linkelésnél:", error);
      setIsGithubLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" /> Personal Information
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-2 border-border shadow-sm shrink-0">
              <AvatarImage src={image} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center">
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]) setImage(res[0].url);
                  }}
                  onUploadError={(error: Error) => {
                    alert(`Upload Error: ${error.message}`);
                  }}
                  appearance={{
                    button: "!bg-primary !text-primary-foreground hover:!bg-primary/90 !h-9 !px-4 !py-2 !text-sm !font-medium !rounded-md !w-max !m-0 after:!bg-white/20 transition-colors",
                    container: "!w-max !flex-row !items-start !p-0 !m-0",
                    allowedContent: "hidden"
                  }}
                  content={{ button: "Upload Image" }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Max 2MB. </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Username / Full Name</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              className="max-w-md"
            />
          </div>

          <div className="pt-6 flex items-center gap-4 border-t border-border/50">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
            {isSuccess && (
              <span className="text-sm text-emerald-500 flex items-center gap-1 font-medium animate-in fade-in">
                <CheckCircle2 className="h-4 w-4" /> Saved successfully
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-primary" /> Connected Accounts
        </h2>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl bg-muted/10 gap-4 transition-all hover:bg-muted/20">
          <div className="flex items-center gap-4">
            <div className="bg-background p-2.5 rounded-full border shadow-sm shrink-0">
              <Github className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">GitHub</h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-[300px]">
                Link your GitHub account to directly sync commits and repositories with your tasks.
              </p>
            </div>
          </div>
          
          <div className="shrink-0">
            {isGithubLinked ? (
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md text-sm font-semibold cursor-default">
                <CheckCircle2 className="h-4 w-4" />
                Connected
              </div>
            ) : (
              <Button 
                variant="outline" 
                onClick={handleLinkGithub} 
                disabled={isGithubLoading}
                className="w-full sm:w-auto"
              >
                {isGithubLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Github className="h-4 w-4 mr-2" />
                )}
                {isGithubLoading ? "Connecting..." : "Connect Account"}
              </Button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}