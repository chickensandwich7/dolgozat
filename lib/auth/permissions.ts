import { createAccessControl } from "better-auth/plugins/access";

const statemant = {
    project : ["create", "share", "update", "delete"],
}as const;

const ac=createAccessControl(statemant);

const developer = ac.newRole({
    project: ["create"],
});

const teamlead = ac.newRole({
    project : ["create", "update"],
});

const admin = ac.newRole({
    project : ["create", "update", "delete"],
});

export {admin, teamlead, developer, ac, statemant};