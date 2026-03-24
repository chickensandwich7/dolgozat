import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/drizzle"; 
import { schema } from "@/db/schema"
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { getActiveOrganization } from "@/server/organizations";

export const auth = betterAuth({
    emailAndPassword:{
        enabled: true
    },
    database: drizzleAdapter(db, {

        provider: "pg", 
        schema,
    }),
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        }
    },
    plugins: [organization(), nextCookies()],


    databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const organization = await getActiveOrganization(session.userId);
          return {
            data: {
              ...session,
              activeOrganizationId: organization ? organization.id : null
            }
          };
        }
      }
    }
  }
});