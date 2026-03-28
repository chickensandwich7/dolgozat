"use server";


import { db } from "@/db/drizzle";
import { eq, inArray, and } from "drizzle-orm";
import { organization, member, invitation } from "@/db/schema";
import { getCurrentUser } from "./users";




export async function getOrganizations() {
  const { currentUser } = await getCurrentUser();

    const members = await db.query.member.findMany({
        where: eq(member.userId, currentUser.id),
    });

  const organizations = await db.query.organization.findMany({
    where: inArray(organization.id, members.map((member) => member.organizationId)),
  });

  return organizations;
}


export async function getActiveOrganization(userId: string) {
  const memberUser = await db.query.member.findFirst({
    where: eq(member.userId, userId),
  });

  if (!memberUser) {
    return null;
  }

  const activeOrganization = await db.query.organization.findFirst({
    where: eq(organization.id, memberUser.organizationId),
  });

  return activeOrganization;
}

export async function getOrganizationBySlug(slug: string){
  try{
    const getOrganizationBySlug = await db.query.organization.findFirst({
      where: eq(organization.slug, slug),
      with: {
        members: {
          with:{
            user: true, 
          },
        },
      },
    });
    
    return getOrganizationBySlug;
  } catch(error){
    console.error(error);
    return null;
  }
}

export const getPendingInvitations = async (userEmail: string) => {
  try {
    const results = await db
      .select({
        id: invitation.id,
        organizationId: invitation.organizationId,
        organizationName: organization.name,
        role: invitation.role,
      })
      .from(invitation)
      .innerJoin(organization, eq(invitation.organizationId, organization.id))
      .where(
        and(
          eq(invitation.email, userEmail),
          eq(invitation.status, "pending")
        )
      );

    return results;
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return [];
  }
};