// Layout interior con navegación principal para zona autenticada.
import Link from "next/link";
import {
  Activity,
  BookOpen,
  ClipboardCheck,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
} from "lucide-react";
import { ToggleTema } from "./toggle-tema";
import type { SessionUser } from "@/lib/auth";
import { accionLogout } from "@/actions/auth";
import { NavLink } from "./nav-link";

export function Shell({
  user,
  children,
  esAdmin = false,
}: {
  user: SessionUser;
  children: React.ReactNode;
  esAdmin?: boolean;
}) {
  const navUsuario = [
    { href: "/panel", label: "Panel", Icon: LayoutDashboard },
    { href: "/metricas", label: "Métricas", Icon: Activity },
    { href: "/biblioteca", label: "Biblioteca", Icon: BookOpen },
    { href: "/cuestionarios", label: "Cuestionarios", Icon: ClipboardCheck },
    { href: "/consultas", label: "Consultas", Icon: MessageCircle },
  ];
  const navAdmin = [
    { href: "/admin", label: "Resumen", Icon: LayoutDashboard },
    { href: "/admin/usuarios", label: "Usuarios", Icon: Settings },
    { href: "/admin/contenidos", label: "Contenidos", Icon: BookOpen },
    { href: "/admin/consultas", label: "Consultas", Icon: MessageCircle },
  ];
  const items = esAdmin ? navAdmin : navUsuario;

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="sticky top-0 z-30 backdrop-blur bg-background/85 border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href={esAdmin ? "/admin" : "/panel"}
              className="flex items-center gap-2 font-display font-semibold"
            >
              <HeartPulse className="h-6 w-6 text-primary" />
              <span className="hidden sm:inline">Pulse Point</span>
            </Link>
            <nav
              className="hidden md:flex items-center gap-1"
              aria-label="Principal"
            >
              {items.map(({ href, label, Icon }) => (
                <NavLink key={href} href={href}>
                  <Icon className="h-4 w-4" /> {label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ToggleTema />
            {user.role === "admin" && !esAdmin && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex px-3 py-2 text-sm font-medium hover:text-primary"
              >
                Panel admin
              </Link>
            )}
            {esAdmin && (
              <Link
                href="/panel"
                className="hidden sm:inline-flex px-3 py-2 text-sm font-medium hover:text-primary"
              >
                Vista usuario
              </Link>
            )}
            <span className="hidden lg:inline text-sm text-muted-foreground">
              {user.nombre ?? user.email}
            </span>
            <form action={accionLogout}>
              <button
                type="submit"
                title="Cerrar sesión"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-card hover:bg-accent"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
        {/* Nav móvil */}
        <nav
          className="md:hidden border-t bg-background/85 overflow-x-auto"
          aria-label="Principal móvil"
        >
          <div className="px-2 py-2 flex gap-1 min-w-max">
            {items.map(({ href, label, Icon }) => (
              <NavLink key={href} href={href}>
                <Icon className="h-4 w-4" /> {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        {children}
      </main>
      <footer className="border-t bg-background">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground flex items-center justify-between">
          <span>© {new Date().getFullYear()} Pulse Point</span>
          <span>Datos privados — Cumplimiento RGPD</span>
        </div>
      </footer>
    </div>
  );
}
