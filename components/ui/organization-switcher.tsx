"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { Organization } from "@/db/schema";

interface OrganizationSwitcherProps{
    organizations: Organization[];
}

export function OrganizationSwitcher({
  organizations,
}: OrganizationSwitcherProps) {
    const { data: activeOrganization } = authClient.useActiveOrganization()
  const handleChangeOrganization = async (organizationId: string) => {
    await authClient.organization.setActive({
      organizationId,
    });
  };
    
  return (
  <Select onValueChange={handleChangeOrganization} value={activeOrganization?.id}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Theme" />
    </SelectTrigger>
    <SelectContent>
      {organizations.map((organization) => (
        <SelectItem key={organization.id} value={organization.id}>
          {organization.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
}