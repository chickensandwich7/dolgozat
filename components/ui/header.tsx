import { organization } from "better-auth/plugins";

import { OrganizationSwitcher } from "./organization-switcher";
import { getOrganizations } from "@/server/organizations";

export async function Header(){
    const organizations = await getOrganizations();
    return(
        <header className="absolute top-0 right-0 flex w-full items-center justify-between p-4">
            <OrganizationSwitcher organizations={organizations}/>
        
    </header>
    );
    
}