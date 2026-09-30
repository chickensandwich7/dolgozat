import { createAccessControl } from "better-auth/plugins/access";

const statemant = {
    project: ["create", "share", "update", "delete"],
    organization: ["update", "delete"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    task: ["create", "update", "delete", "assign"],
} as const;

const ac = createAccessControl(statemant);

const developer = ac.newRole({
    project: ["create"],
});

const teamlead = ac.newRole({
    project: ["create", "update"],
    task: ["create", "update", "assign"],
});

const admin = ac.newRole({
    project: ["create", "update", "delete"],
    organization: ["update"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    task: ["create", "update", "delete", "assign"],
});

const owner = ac.newRole({
    project: ["create", "share", "update", "delete"],
    organization: ["update", "delete"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    task: ["create", "update", "delete", "assign"],
});

export { admin, teamlead, developer, owner, ac, statemant };