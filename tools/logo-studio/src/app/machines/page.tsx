import { auth } from "@/auth";
import PageHeading from "@/components/PageHeading";
import MachinesClient from "./MachinesClient";

export default async function MachinesPage() {
  const session = await auth();
  const user = session?.user?.email ? { name: session.user.name || session.user.email, email: session.user.email } : null;

  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Edit Bay" title="Machine Tracker" sub="See who's on which editing workstation. Presence only — it doesn't touch the actual machines." />
      <MachinesClient user={user} />
    </div>
  );
}
