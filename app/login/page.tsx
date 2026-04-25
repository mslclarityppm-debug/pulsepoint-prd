// Página de inicio de sesión.
import Link from "next/link";
import { redirect } from "next/navigation";
import { HeartPulse } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCSRFToken } from "@/lib/csrf";
import { FormularioLogin } from "./formulario-login";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const u = await getCurrentUser();
  if (u) redirect(u.role === "admin" ? "/admin" : "/panel");

  const csrfToken = await getCSRFToken();

  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 mb-8 font-display font-semibold"
        >
          <HeartPulse className="h-7 w-7 text-primary" />
          <span className="text-lg">Pulse Point</span>
        </Link>
        <div className="rounded-lg bg-card border shadow-sm p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accede para registrar tus métricas y ver tu progreso.
          </p>
          <FormularioLogin csrfToken={csrfToken} />
          <p className="mt-4 text-sm text-muted-foreground text-center">
            <Link href="/forgot-password" className="text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="text-primary hover:underline">
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
