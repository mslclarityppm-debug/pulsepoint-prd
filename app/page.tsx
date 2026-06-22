// Landing pública: muestra la propuesta de valor y CTAs login/registro.
// Si el usuario ya está logueado, redirige a su panel.
import {
  Activity,
  BookOpen,
  ClipboardCheck,
  HeartPulse,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ToggleTema } from "@/components/ui-app/toggle-tema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "admin" ? "/admin" : "/panel");
  }

  const esenciales = [
    "Sueño",
    "Tensión arterial",
    "Colesterol",
    "Dieta",
    "Actividad física",
    "Tabaco / vapeo",
    "Peso",
    "Glucosa",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
<Link href="/" className="flex items-center gap-2 font-display font-semibold">
              <HeartPulse className="h-6 w-6 text-primary" />
              <span>Pulse Point</span>
            </Link>
           <div className="flex items-center gap-2">
             <ToggleTema />
             <Link
               href="/login"
               className="px-3 py-2 text-sm font-medium hover:text-primary"
             >
               Iniciar sesión
             </Link>
             <Link
               href="/registro"
               className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
             >
               Crear cuenta
             </Link>
           </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="max-w-3xl">
            <span className="badge badge-primary mb-4">Salud preventiva</span>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              Toma el control de tu <span className="text-primary">salud cardiovascular</span>.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Registra tus métricas, aprende con contenido veraz y resuelve tus dudas con un equipo de profesionales. Todo en un solo lugar, sencillo y seguro.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/registro"
                className="px-5 py-3 rounded-md bg-primary text-primary-foreground font-medium shadow-sm hover:opacity-90"
              >
                Empezar ahora
              </Link>
              <Link
                href="/login"
                className="px-5 py-3 rounded-md border bg-card font-medium hover:bg-accent"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>

        {/* Funcionalidades */}
        <section className="bg-muted/40 border-y">
          <div className="mx-auto max-w-6xl px-4 py-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                Icon: Activity,
                titulo: "Registro de métricas",
                desc: "Peso y tensión arterial con visualización de evolución.",
              },
              {
                Icon: BookOpen,
                titulo: "Biblioteca educativa",
                desc: "Vídeos, infografías y artículos avalados.",
              },
              {
                Icon: ClipboardCheck,
                titulo: "Cuestionarios breves",
                desc: "5 preguntas quincenales con puntuación inmediata.",
              },
              {
                Icon: MessageCircle,
                titulo: "Consultas asincrónicas",
                desc: "Resuelve dudas con el equipo gestor.",
              },
            ].map(({ Icon, titulo, desc }) => (
              <div
                key={titulo}
                className="rounded-lg bg-card p-5 shadow-sm border"
              >
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-semibold">{titulo}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 8 esenciales */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Los 8 factores esenciales
          </h2>
          <p className="mt-2 text-muted-foreground">
            Inspirado en las recomendaciones de salud cardiovascular preventiva.
          </p>
          <ul className="mt-6 grid gap-3 grid-cols-2 md:grid-cols-4">
            {esenciales.map((e) => (
              <li
                key={e}
                className="rounded-md border bg-card p-3 text-sm flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4 text-primary" />
                {e}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Pulse Point</span>
          <span>MVP de salud preventiva</span>
        </div>
      </footer>
    </div>
  );
}
