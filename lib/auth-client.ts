import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"
import { ac, admin, developer, teamlead, owner } from "./auth/permissions"

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000",
    plugins : [
        organizationClient({
            ac,
            roles: {
                developer,
                admin,
                teamlead,
                owner,
            },
        })
    ]
})