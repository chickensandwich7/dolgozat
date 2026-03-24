import { Button } from "../../components/ui/button"; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CreateOrganizationForm } from "@/components/forms/create-organization-form";

import { Logout } from "@/components/ui/logout";


export default async function DashboardPage() {

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-10">
      
      <Logout />
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Create Organization</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to get started.
            </DialogDescription>
          </DialogHeader>
          <CreateOrganizationForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}