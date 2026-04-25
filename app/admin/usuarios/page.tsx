// Listado de usuarios para el admin (sin acción destructiva).
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users as usersTable, userProfiles, healthMetrics } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatearFecha } from "@/lib/formato";
import { count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { validateCSRFToken } from "@/lib/csrf";

export const dynamic = "force-dynamic";

async function Page() {
  await requireAdmin();
  const lista = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
      nombre: userProfiles.nombre,
      apellidos: userProfiles.apellidos,
    })
    .from(usersTable)
    .leftJoin(userProfiles, eq(userProfiles.userId, usersTable.id))
    .orderBy(desc(usersTable.createdAt));

  const conteos = await db
    .select({ userId: healthMetrics.userId, c: count() })
    .from(healthMetrics)
    .groupBy(healthMetrics.userId);
  const mapaConteo = new Map<number, number>();
  for (const r of conteos ?? []) mapaConteo.set(r.userId, Number(r.c ?? 0));

  const csrfToken = await (await import("@/lib/csrf")).getCSRFToken();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          Usuarios
        </h1>
        <p className="text-muted-foreground mt-1">
          Lista de usuarios registrados.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-2 pr-3">Nombre</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Rol</th>
              <th className="py-2 pr-3">Métricas</th>
              <th className="py-2 pr-3">Alta</th>
              <th className="py-2 pr-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {(lista ?? []).map((u) => (
              <tr key={u.id} className="border-t">
                <td className="py-2 pr-3">
                  {u.nombre ? `${u.nombre} ${u.apellidos ?? ""}` : "—"}
                </td>
                <td className="py-2 pr-3 font-mono text-xs">{u.email}</td>
                <td className="py-2 pr-3">
                  <span
                    className={`badge ${
                      u.role === "admin" ? "badge-primary" : "badge-muted"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-2 pr-3">{mapaConteo.get(u.id) ?? 0}</td>
                <td className="py-2 pr-3 text-muted-foreground">
                  {formatearFecha(u.createdAt)}
                </td>
                <td className="py-2 pr-3">
                  <form
                    action={async (fd: FormData) => {
                      "use server";
                      await requireAdmin();
                      const userId = parseInt(fd.get("userId") as string);
                      const newRole = fd.get("role") as "user" | "admin";
                      const csrfToken = fd.get("csrf") as string;

                      if (!(await validateCSRFToken(csrfToken))) {
                        throw new Error("Token CSRF inválido");
                      }

                      await db
                        .update(usersTable)
                        .set({ role: newRole })
                        .where(eq(usersTable.id, userId));
                      revalidatePath("/admin/usuarios");
                    }}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="userId" value={u.id} />
                    <input
                      type="hidden"
                      name="role"
                      value={u.role === "admin" ? "user" : "admin"}
                    />
                    <input type="hidden" name="csrf" value={csrfToken} />
                    <button
                      type="submit"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Cambiar a {u.role === "admin" ? "usuario" : "admin"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Page;
