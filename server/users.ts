"use server";

import { db } from "@/db/drizzle";
import { member, user } from "@/db/schema";
import { auth } from "@/lib/auth"
import { eq, inArray, not, or, ilike, and } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";



export const getCurrentUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!currentUser) {
    redirect("/login");
  }

  return {
    ...session,
    currentUser
  }
}

export const signIn = async (email: string, password: string) => {
    try{
        
        await auth.api.signInEmail({
        body: {
            email,
            password,
        }
    })
    return{
        success:true,
        message: "Signed in succesfully."
    }
    
}catch(error){
    const e =error as Error
        return{
            successs:false,
            message:  e.message || "An unkown error occured."
        }
    }

    
   
}


export const signUp = async (email: string, password: string, username: string) => {
    try{
    await auth.api.signUpEmail({
        body:{
            email,
            password,
            name: username
        }
    })
    return{
        success: true,
        message: "Signed up successfully."
    }
} catch(error){
    const e = error as Error
    return{
        success: false,
        message: e.message || "An unknow error occured."
    }
}
}

export const searchUsersToInvite = async (organizationId: string, searchQuery: string) => {
  try {
    if (!searchQuery || searchQuery.length < 2) {
      return [];
    }

    const currentMembers = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
    });
    const memberIds = currentMembers.map((m) => m.userId);
    const searchCondition = or(
      ilike(user.name, `%${searchQuery}%`),
      ilike(user.email, `%${searchQuery}%`)
    );

    const users = await db.query.user.findMany({
      where: memberIds.length > 0 
        ? and(searchCondition, not(inArray(user.id, memberIds))) 
        : searchCondition, 
      limit: 5, 
    });

    return users;

  } catch (error) {
    console.error("Error seatching for users:", error);
    return [];
  }
};
