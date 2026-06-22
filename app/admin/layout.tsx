// Layout para el panel de administración. Requiere rol admin.
import { redirect } from "next/navigation";

import { Shell } from "@/components/ui-app/shell";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/panel");
  return (
    <Shell user={user} esAdmin>
      {children}
    </Shell>
  );
}
