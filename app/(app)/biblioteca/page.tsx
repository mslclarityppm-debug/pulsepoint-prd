// Biblioteca de contenidos educativos.
import { asc, eq } from "drizzle-orm";
import { ExternalLink, FileText, Image as ImageIcon, Video } from "lucide-react";

import { db } from "@/db";
import { contents } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ICONO: Record<string, typeof Video> = {
  video: Video,
  infografia: ImageIcon,
  articulo: FileText,
};

const ETIQUETA_CAT: Record<string, string> = {
  sueno: "Sueño",
  tension: "Tensión",
  colesterol: "Colesterol",
  dieta: "Dieta",
  actividad_fisica: "Actividad física",
  tabaco: "Tabaco / vapeo",
  peso: "Peso",
  glucosa: "Glucosa",
};

export default async function BibliotecaPage() {
  await requireUser();
  const items = await db
    .select()
    .from(contents)
    .where(eq(contents.activo, true))
    .orderBy(asc(contents.orden));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          Biblioteca
        </h1>
        <p className="text-muted-foreground mt-1">
          Contenido educativo veraz sobre los 8 esenciales.
        </p>
      </div>

      {items?.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => {
            const Icon = ICONO[c.tipo] ?? FileText;
            return (
              <li key={c.id}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="block rounded-lg border bg-card p-5 shadow-sm hover:shadow-md transition group"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-md bg-accent text-accent-foreground grid place-items-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{c.tipo}</span>
                        {c.categoria && (
                          <>
                            <span>·</span>
                            <span>{ETIQUETA_CAT[c.categoria] ?? c.categoria}</span>
                          </>
                        )}
                      </div>
                      <h3 className="mt-1 font-semibold leading-snug group-hover:text-primary">
                        {c.titulo}
                      </h3>
                      {c.descripcion && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                          {c.descripcion}
                        </p>
                      )}
                      <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
                        Abrir <ExternalLink className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aún no hay contenidos publicados.
        </p>
      )}
    </div>
  );
}
