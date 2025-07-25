import { CreateGroupForm } from "../../../../components/create-group-form";

export default function NewGroupPage() {
  return (
    <div className="max-w-md">
      <h1 className="text-3xl font-bold">Create a new group</h1>
      <p className="mt-2 text-muted-foreground">Enter a name for your new group below.</p>
      <div className="mt-6">
        <CreateGroupForm />
      </div>
    </div>
  );
}
