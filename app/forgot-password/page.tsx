// Página para solicitar reseteo de contraseña.
import { HeartPulse } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getCSRFToken } from "@/lib/csrf";

import { FormularioForgotPassword } from "./formulario-forgot-password";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
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
            Restablecer contraseña
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>
          <FormularioForgotPassword csrfToken={csrfToken} />
          <p className="mt-6 text-sm text-muted-foreground text-center">
            <Link href="/login" className="text-primary hover:underline">
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}