"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Loader2, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SettingsForm({ user }: { user: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [image, setImage] = useState(user?.image || "");
  const email = user?.email || "";
  const initials = user?.name?.substring(0, 2).toUpperCase() || "U";

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const isConfirmed = window.confirm("Are you sure you want to save these changes to your profile?");
    if (!isConfirmed) {
      return; 
    }

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

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <User className="h-5 w-5 text-primary" /> Personal Information
      </h2>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <Avatar className="h-20 w-20 border-2 border-border shadow-sm">
            <AvatarImage src={image} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1.5 flex-1">
            <Label>Profile Picture URL</Label>
            <Input 
              placeholder="https://example.com/avatar.png" 
              value={image} 
              onChange={(e) => setImage(e.target.value)} 
              className="max-w-md"
            />
            <p className="text-[10px] text-muted-foreground">Paste a direct image link to update your avatar.</p>
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

        <div className="space-y-2 pt-2">
          <Label>Email Address</Label>
          <div className="max-w-md px-3 py-2.5 bg-muted/30 border border-border/50 rounded-md text-sm text-muted-foreground flex items-center justify-between">
            {email}
            <span className="text-[10px] bg-background px-2 py-0.5 rounded border uppercase tracking-wider font-semibold shadow-sm">
              Primary
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Your email address is managed by your sign-in provider (e.g., GitHub) and cannot be changed here.
          </p>
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
  );
}