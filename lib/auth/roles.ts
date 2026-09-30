export const ROLES = ["owner", "admin", "teamlead", "developer"] as const;
export type Role = (typeof ROLES)[number];

export function canManageOrg(role?: string | null) {
  return role === "owner" || role === "admin";
}

export function canManageMembers(role?: string | null) {
  return role === "owner" || role === "admin";
}

export function canManageTasks(role?: string | null) {
  return role === "owner" || role === "admin" || role === "teamlead";
}
