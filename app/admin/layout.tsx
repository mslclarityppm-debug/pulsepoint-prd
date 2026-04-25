// Layout para el panel de administración. Requiere rol admin.
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Shell } from "@/components/ui-app/shell";

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
