# App-Turnos-Estambul

Gestión de turnos laborales y roles de usuario para empresas, desarrollado con Next.js y TypeScript. Este proyecto permite administrar turnos, exportar reportes, y gestionar roles como cajero y conductor, integrando autenticación y base de datos con Supabase.

---

## 🚀 Descripción General
App-Turnos-Estambul es una aplicación web para la gestión eficiente de turnos laborales, revisión de actividades y exportación de reportes mensuales. Está diseñada para entornos empresariales donde se requiere control de roles (cajero, conductor, admin) y sincronización dinámica de datos.

---

## 🛠️ Tecnologías Utilizadas
- **Next.js** (App Router)
- **TypeScript**
- **Supabase** (autenticación y base de datos)
- **Tailwind CSS** (estilos)
- **jsPDF + jspdf-autotable** (exportación PDF)
- **LocalStorage** (gestión de estado local)

---

## 📁 Estructura de Carpetas
- `app/` – Rutas y páginas por rol (`cashier`, `driver`, `admin`, `login`).
- `components/` – Componentes React compartidos y UI (`ui/` para elementos reutilizables).
- `hooks/` – Hooks personalizados (`use-mobile`, `use-toast`).
- `lib/` – Lógica de negocio y utilidades (`shift-manager`, `review-system`, `supabase-client`).
- `public/` – Recursos estáticos (logos, imágenes).
- `scripts/` – Scripts SQL y Node.js para gestión de base de datos.
- `styles/` – Estilos globales.

---

## ⚡ Instalación y Ejecución
1. **Instalar dependencias:**
   ```bash
   pnpm install
   ```
2. **Ejecutar servidor de desarrollo:**
   ```bash
   pnpm dev
   ```
3. **Compilar para producción:**
   ```bash
   pnpm build
   ```
4. **Configurar base de datos:**
   - Edita tu archivo `.env.local` con las claves de Supabase.
   - Ejecuta los scripts SQL desde `scripts/` para migraciones y configuración inicial.

---

## 🧩 Convenciones de Código
- **Componentes UI:** En `components/ui/`, nombrados por función (`button.tsx`, `table.tsx`).
- **Hooks:** En `hooks/`, nombrados como `useX.ts`.
- **Lógica de negocio:** En `lib/`, organizada por dominio.
- **TypeScript:** Todo el código es tipado.
- **Separación:** Sin archivos monolíticos; lógica dividida en módulos enfocados.

---

## 📝 Reglas Internas de Desarrollo
1. Usa **tabulación** para formatear el código.
2. Prioriza **soluciones simples** y directas.
3. Reinicia siempre el servidor tras cambios importantes.
4. Finaliza servidores previos antes de iniciar uno nuevo.
5. **Reutiliza código existente**; evita duplicación.
6. Mantén la base de código **limpia y organizada**.
7. No introduzcas nuevas tecnologías sin eliminar la anterior.
8. Escribe código compatible con desarrollo, pruebas y producción.
9. Realiza solo los cambios solicitados o comprendidos.
10. Evita scripts directos en archivos; usa scripts externos.

---

## 🔌 Puntos de Integración
- **Supabase:** Autenticación y acceso a datos (`lib/supabase-client.ts`).
- **Scripts SQL:** Migraciones y configuración (`scripts/`).

---

## 📚 Ejemplos de Patrones Comunes
- **Agregar componente UI:**
  1. Crea el archivo en `components/ui/`.
  2. Importa y usa en la página o componente necesario.
- **Agregar lógica de negocio:**
  1. Crea el archivo en `lib/`.
  2. Utiliza la función en los paneles o hooks.
- **Agregar nueva ruta:**
  1. Crea carpeta en `app/` y agrega `page.tsx`.

---

## 👥 Créditos y Referencias
- Proyecto desarrollado por EdwinLZ y colaboradores.
- Referencias: [Next.js Docs](https://nextjs.org/docs), [Supabase Docs](https://supabase.com/docs), [Tailwind CSS](https://tailwindcss.com/).

---

Para dudas, sugerencias o mejoras, consulta la documentación interna o contacta al equipo de desarrollo.
