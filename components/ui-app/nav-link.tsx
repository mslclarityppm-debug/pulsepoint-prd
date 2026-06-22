"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const path = usePathname() ?? "";
  // Activo si la ruta empieza con el href (excepto para raíz "/admin")
  const activo =
    href === "/admin"
      ? path === "/admin"
      : path === href || path.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition",
        activo
          ? "bg-accent text-accent-foreground"
          : "text-foreground/80 hover:bg-accent/60 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
