# AGENTS.md — Comisariato Mi Comercio Web
## Proyecto
Comisariato Mi Comercio, Portoviejo, Manabí, Ecuador.
No confundir con Mi Comisariato de Corporación El Rosado.
Metodología obligatoria: Spec-Driven Development (SDD).

## Fuentes de verdad
- `DOCS/`: Documento Maestro v1.1 y decisiones globales.
- `SPECS/`: 34 especificaciones de implementación.
- `PROGRESS.md`: progreso y trazabilidad.
No inventar requisitos ni información del negocio.

## Flujo SDD
Antes de desarrollar, leer `DOCS/` y revisar las 34 SPECS.
Antes de cada SPEC leerla completa, revisar dependencias, documentación, código y `PROGRESS.md`.
Trabajar en orden: `SPEC-001 → SPEC-002 → ... → SPEC-034`.
Flujo: leer → analizar → implementar → probar → validar → documentar.
No adelantarse a otras SPECS ni iniciar la siguiente sin autorización.
Ante contradicciones que cambien el producto, detenerse y preguntar.

## PROGRESS.md
Si no existe, crearlo con las 34 SPECS.
Estados: `PENDIENTE`, `EN PROGRESO`, `BLOQUEADA`, `EN VALIDACIÓN`, `COMPLETADA`.
Cada SPEC debe mostrar progreso real de `0%` a `100%`.
Actualizar al comenzar, avanzar, bloquearse, validar y completar.
Registrar: implementado, archivos, decisiones, pruebas, problemas y pendientes.
Mantener porcentaje global del proyecto.
Solo marcar 100% tras cumplir implementación, aceptación y validaciones.

## Stack
Next.js + React + TypeScript + Tailwind CSS + Supabase + PostgreSQL.
Supabase Auth + Storage + Lucide + Vercel + Git.
Picking será una integración externa posterior.
No cambiar el stack principal sin autorización.

## Herramientas
- `ripgrep (rg)`: búsqueda rápida de texto, referencias, imports y patrones.
- `ast-grep (sg)`: búsqueda y análisis estructural del código mediante AST.
- `fd`: búsqueda rápida de archivos y directorios.
Priorizar `rg` para texto, `sg` para código estructural y `fd` para archivos.
Usar Git (`status`, `diff`, `log`) para inspeccionar cambios.
Usar npm y herramientas oficiales; evitar dependencias innecesarias.
No realizar operaciones destructivas de Git sin autorización.

## Ingeniería y calidad
Usar App Router, TypeScript estricto y características estables de Next.js.
Preferir Server Components; Client Components solo cuando sean necesarios.
Evitar `any`, `@ts-ignore`, duplicación, hacks y sobreingeniería.
Aplicar autorización de servidor, RLS, mínimo privilegio y protección de secretos.
No inventar APIs, endpoints, credenciales ni integración de Picking.
Objetivo obligatorio: WCAG 2.2 AA y responsive móvil/tablet/escritorio.
Core Web Vitals: LCP ≤2.5 s, INP ≤200 ms y CLS ≤0.1.

## Validación
Antes de completar una SPEC ejecutar lint, typecheck, build y pruebas aplicables.
Usar pruebas unitarias/integración y Playwright E2E cuando corresponda.
Para UI comprobar navegador, responsive, consola, errores y accesibilidad.
No marcar 100% con validaciones críticas fallando.

## Prohibiciones
No añadir 2FA, pagos web, delivery, portal mayorista ni roles operativos de empleados.
No modificar desde la web precios, stock o promociones comerciales de Picking.
No ampliar silenciosamente una SPEC ni eliminar controles para hacer pasar validaciones.

## Cierre
Codex puede decidir detalles técnicos internos que no cambien requisitos aprobados.
Debe preguntar si cambia negocio, UX, seguridad, privacidad o contradice documentación.
Al terminar cada SPEC actualizar `PROGRESS.md` y reportar trabajo, pruebas y pendientes.
Después detenerse y esperar autorización para comenzar la siguiente SPEC.