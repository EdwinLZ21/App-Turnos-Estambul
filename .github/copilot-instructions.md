# 🧭 Instrucciones para Copilot – App-Turnos-Estambul

## 🗂️ Descripción del Proyecto  
Esta es una aplicación desarrollada con Next.js (TypeScript) para gestionar turnos laborales y roles de usuario (cajero, conductor) en un entorno empresarial. La arquitectura es modular, con una separación clara entre componentes de interfaz, lógica de negocio y acceso a datos.

---

## 📁 Estructura de Carpetas y Archivos Clave  
- `app/`: Estructura de rutas de Next.js. Contiene carpetas por rol (cajero, conductor, login, etc.).  
- `components/`: Componentes React compartidos. El subdirectorio `ui/` incluye elementos reutilizables como botones, tablas y notificaciones.  
- `hooks/`: Hooks personalizados para detección móvil, toasts, etc.  
- `lib/`: Lógica de negocio y utilidades (manejo de fechas, gestión de turnos, cliente Supabase).  
- `public/`: Recursos estáticos (logos, imágenes).  
- `scripts/`: Scripts SQL y Node.js para configuración y gestión de la base de datos.  
- `styles/`: Estilos CSS globales.

---

## 🔄 Arquitectura y Flujo de Datos  
- **Ruteo:** Utiliza el router de Next.js (`app/`). Cada rol tiene su propio dashboard y formularios.  
- **Estado y Autenticación:** Se usa Supabase para autenticación y acceso a datos (`lib/supabase-client.ts`).  
- **Patrón UI:** Se favorece la composición mediante componentes pequeños y enfocados en `components/ui/`. La lógica compartida se abstrae en hooks y utilidades.  
- **Base de Datos:** Los scripts SQL en `scripts/` indican una base de datos relacional, gestionada con Supabase y scripts personalizados.

---

## 🛠️ Flujo de Trabajo para Desarrolladores  
- **Instalar dependencias:** `pnpm install`  
- **Ejecutar servidor de desarrollo:** `pnpm dev`  
- **Compilar para producción:** `pnpm build`  
- **Configurar base de datos:** Usar los scripts en `scripts/` (ej. `run_sql.js`, `create_driver_shifts.sql`).  
- **Estilizado:** Usar estilos globales en `styles/globals.css` y módulos CSS por componente.

---

## 📐 Convenciones del Proyecto  
- **Nombres de Componentes:** Los elementos UI están en `components/ui/`, nombrados según su función (`button.tsx`, `table.tsx`).  
- **Hooks:** Los hooks personalizados están en `hooks/`, nombrados como `useX.ts`.  
- **Utilidades en Lib:** La lógica de negocio está en `lib/`, organizada por dominio (`shift-manager.ts`, `review-system.ts`).  
- **TypeScript:** Todo el código está escrito en TypeScript para garantizar seguridad de tipos.  
- **Sin archivos monolíticos:** La lógica está dividida en módulos enfocados.

---

## 🔌 Puntos de Integración  
- **Supabase:** Para autenticación y acceso a datos (`lib/supabase-client.ts`).  
- **Scripts SQL:** Para configuración y migraciones de base de datos (`scripts/`).

---

## 🧪 Patrones de Ejemplo  
- Para agregar un nuevo elemento UI, créalo en `components/ui/` e impórtalo donde se necesite.  
- Para agregar lógica de negocio, crea un archivo en `lib/` y úsalo en las páginas o componentes correspondientes.  
- Para nuevas rutas, crea una carpeta en `app/` y un archivo `page.tsx`.

---

## 📚 Referencias  
- `lib/supabase-client.ts` (Integración con Supabase)  
- `components/ui/` (Primitivas de UI)  
- `app/driver/dashboard/page.tsx` (Ruteo por rol)  
- `scripts/run_sql.js` (Gestión de base de datos)

---

## 📏 Reglas Adicionales de Desarrollo

1. Utiliza siempre la **tabulación** para formatear el código.  
2. Prioriza **soluciones simples** y directas.  
3. Tras realizar cambios, **inicia siempre un nuevo servidor** para realizar pruebas (si aplica).  
4. **Finaliza todos los servidores** anteriores antes de iniciar uno nuevo.  
5. **Reutiliza código existente** siempre que sea posible; evita reinventar la rueda.  
6. **Evita duplicación de código**; revisa si ya existe lógica similar antes de escribir algo nuevo.  
7. Escribe código que contemple los **entornos de desarrollo, pruebas y producción**.  
8. Realiza **solo los cambios solicitados** o aquellos que comprendas completamente y estén relacionados.  
9. Al corregir errores, **no introduzcas nuevas tecnologías o patrones** sin antes agotar las opciones actuales. Si lo haces, **elimina la implementación anterior** para evitar duplicidad.  
10. Mantén la base de código **limpia y organizada**.  
11. Evita escribir **scripts directamente en archivos** si solo se van a ejecutar una vez. Usa scripts externos o herramientas adecuadas.

---
