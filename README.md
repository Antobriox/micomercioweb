# Comisariato Mi Comercio Web

Entorno de demostración de Comisariato Mi Comercio en Portoviejo, Manabí. La aplicación mantiene cerrados los pedidos reales en cualquier entorno. El diagnóstico en `/diagnostico` muestra el entorno técnico y el modo de operación.

## Desarrollo local

Requiere npm y Node.js 22.13+ o 24+, según la rama de Node.js.

| Comando | Acción |
| --- | --- |
| `npm ci` | Instalar las dependencias del lockfile |
| `npm run dev` | Iniciar el servidor de desarrollo |
| `npm run lint` | Ejecutar ESLint |
| `npm run typecheck` | Generar tipos de Next.js y comprobar TypeScript |
| `npm run test:unit` | Probar contratos y reglas |
| `npm run test:db` | Comprobar migraciones, RLS y concurrencia con PostgreSQL temporal |
| `npm run build` | Compilar para producción |
| `npm start` | Ejecutar el build de producción |
| `npx playwright install chromium` | Instalar Chromium para las pruebas de navegador |
| `npm run test:e2e` | Ejecutar la verificación de navegador tras compilar |

## Entornos y estructura

- `app/(public)` contiene las páginas públicas. `app/(private)` y `app/(admin)` reservan las rutas de cuenta y administración con acceso cerrado durante la inicialización.
- `lib/server` contiene configuración exclusiva del servidor. El cliente de Supabase usa la URL y clave publicable de un proyecto aislado de prueba, gestionadas por entorno mediante `.env.local` o la configuración del proveedor. La demostración inicial funciona con ambas variables vacías.
- Vercel identifica la vista previa y producción técnica mediante `VERCEL_ENV`. Ambas ejecutan el mismo modo de demostración. La configuración de despliegue y los secretos permanecen en el proveedor.
- [Progreso y evidencia](PROGRESS.md).
- [Modelo, permisos y pruebas de integración](DOCS/modelo-web.md).
