"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function Logout({ iconOnly = false }: { iconOnly?: boolean }) {
    const router = useRouter();
  const handleLogout = async () => {
    await authClient.signOut();

    router.refresh();
    router.push("/login");
  };

  if (iconOnly) {
    return (
      <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
        <LogOut className="size-4" />
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      Logout <LogOut className="size-4" />
    </Button>
  );
}