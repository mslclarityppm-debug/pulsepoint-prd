# Los 8 Esenciales — MVP de salud preventiva cardiovascular

Aplicación web responsive para el seguimiento preventivo de salud cardiovascular.
Registro de métricas (peso, tensión), biblioteca educativa, cuestionarios de
seguimiento, canal de consultas asíncronas con expertos y panel de administración.

**Versión:** 1.0.1 · compatible con Node.js **18 / 20 / 22 / 24**

---

## 🚀 Despliegue local en Windows — 3 pasos

### ⚠️ Antes de empezar — evita problemas comunes

1. **NO coloques el proyecto en OneDrive / Dropbox / Google Drive** → provoca errores `EPERM` al instalar.
   Recomendado: `C:\Proyectos\los_8_esenciales\`
2. **Cierra editores** (VS Code, Cursor, WebStorm) durante `instalar.bat` → pueden bloquear archivos.
3. **Node.js 20 LTS** recomendado (también funciona con 18, 22 y 24). https://nodejs.org/es/

### 1️⃣ Verificar prerrequisitos

Doble clic en **`requisitos.bat`** — comprueba Node, npm, puerto 3000 y si estás en OneDrive.

### 2️⃣ Instalar (primera vez)

Doble clic en **`instalar.bat`**:

1. Limpia cualquier `node_modules` corrupto previo.
2. Ejecuta `npm install` (≈ 2-5 min).
3. Crea la BD SQLite en `nextjs_space/data/los8.db`.
4. Siembra usuarios demo, métricas, contenidos y un cuestionario.

### 3️⃣ Arrancar / detener

| Acción | Script |
| --- | --- |
| Arrancar en http://localhost:3000 | **`iniciar.bat`** |
| Detener servidor | **`detener.bat`** (o `Ctrl+C`) |

---

## 👥 Cuentas demo (sembradas automáticamente)

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | `admin@los8.es` | `admin12345` |
| Paciente | `paciente@los8.es` | `paciente123` |

---

## 🧱 Stack técnico

- **Next.js 14.2.33 (App Router) + React Server Components + Server Actions**
- **TypeScript estricto** (`strict: true`, `noUncheckedIndexedAccess`, alias `@/*`)
- **Tailwind CSS 3.4** — paleta neutra, WCAG 2.2 AA, modo claro/oscuro automático
- **SQLite embebido** (`better-sqlite3@12` con binarios precompilados Node 18-24) + **Drizzle ORM**
- **Zod** validación cruzada DB ↔ Server Actions ↔ UI
- **@t3-oss/env-nextjs** — variables de entorno tipadas
- **Autenticación** JWT + cookies `httpOnly` + `bcryptjs`
- **Recharts** gráficos · **sonner** toasts

---

## 📂 Estructura

```
los_8_esenciales/
├── requisitos.bat         # Verifica Node / npm / puerto / ruta
├── instalar.bat           # Instalación inicial (una sola vez)
├── iniciar.bat            # Arranca el servidor en :3000
├── detener.bat            # Mata el proceso del puerto 3000
├── README.md
└── nextjs_space/
    ├── app/               # Rutas (App Router)
    │   ├── (app)/         # Zona autenticada (panel, métricas, biblioteca, etc.)
    │   ├── admin/         # Panel gestor
    │   ├── login/  registro/
    │   └── layout.tsx  page.tsx  globals.css
    ├── actions/           # Server Actions (auth, metricas, consultas…)
    ├── db/                # schema.ts + index.ts (Drizzle)
    ├── lib/               # env, auth, validaciones, formato
    ├── components/
    ├── scripts/           # init-db.ts, seed.ts
    ├── package.json       # deps slim
    ├── .env               # SESSION_SECRET
    ├── .env.example
    └── .npmrc             # evita compilación nativa
```

---

## 🧰 Resolución de problemas

### ❌ `gyp ERR! find Python` / `better-sqlite3` no compila

**Causa:** Versión antigua de `better-sqlite3` sin binarios para tu Node.
**Solución:** Esta versión (v1.0.1) usa `better-sqlite3@12` con binarios precompilados para Node 18-24. **Ya no necesitas Python ni Visual Studio Build Tools.**

### ❌ `EPERM: operation not permitted, rmdir node_modules`

**Causa:** Windows bloquea archivos (Defender / antivirus / editor abierto / OneDrive).

**Solución:**
1. Cierra VS Code, Cursor, WebStorm y cualquier terminal en la carpeta.
2. Mueve el proyecto fuera de OneDrive/Dropbox (ej. `C:\Proyectos\los_8_esenciales`).
3. En PowerShell **como administrador**:
   ```powershell
   cd C:\Proyectos\los_8_esenciales\nextjs_space
   taskkill /F /IM node.exe
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Force package-lock.json
   ```
4. Vuelve a ejecutar `instalar.bat`.

### ❌ Puerto 3000 ocupado

Ejecuta `detener.bat` y vuelve a `iniciar.bat`.

### ⚠️ Warnings de deprecación en `npm install`

Son normales (dependencias transitivas). No afectan al funcionamiento.

---

## ✅ Verificación rápida del MVP

1. **Paciente** → Panel → registra peso y tensión en `/metricas/nueva` → gráfico en `/metricas`.
2. `/cuestionarios` → completa uno → puntuación automática.
3. `/consultas/nueva` → crea consulta.
4. Logout → entra como **admin** → `/admin/consultas` → responde.
5. `/admin/contenidos` → publica un artículo → aparece en `/biblioteca`.
6. Alterna tema claro/oscuro desde el header.

---

## 🔒 Notas de seguridad para producción

- Cambia `SESSION_SECRET` en `nextjs_space/.env` por una cadena aleatoria ≥ 32 caracteres.
- SQLite es ideal para MVP single-node; migra a Postgres para multi-instancia.
- Cifrado en reposo para métricas sensibles, rate-limiting en login, CSRF en Server Actions.
- RGPD / LOPDGDD: el registro ya solicita consentimientos explícitos.

---

## 🗄️ Equivalente Linux / macOS

```bash
cd nextjs_space
npm install
npm run db:init
npm run db:seed
npm run dev
```
