// Layout para zona autenticada (usuario regular). Comprueba sesión y monta la shell.
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Shell } from "@/components/ui-app/shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <Shell user={user}>{children}</Shell>;
}
