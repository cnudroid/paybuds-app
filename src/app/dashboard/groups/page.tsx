import { getCurrentUser } from "../../../lib/session";
import { db } from "../../../lib/db";
import Link from "next/link";
import { buttonVariants } from "../../../components/ui/button";

export default async function GroupsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const groups = await db.group.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Groups</h1>
      {groups.length > 0 ? (
        <ul className="space-y-4">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                href={`/dashboard/groups/${group.id}`}
                className="block p-4 border rounded-lg hover:bg-muted transition-colors"
              >
                <h2 className="font-semibold">{group.name}</h2>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center border-2 border-dashed rounded-lg p-12">
          <h2 className="text-xl font-semibold">No groups yet</h2>
          <p className="text-muted-foreground mt-2 mb-4">
            Create a group to start splitting expenses with your friends.
          </p>
          <Link
            href="/dashboard/groups/new"
            className={buttonVariants({ variant: "default" })}
          >
            Create Group
          </Link>
        </div>
      )}
    </div>
  );
}
