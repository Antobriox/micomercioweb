# Progreso de Comisariato Mi Comercio Web

**Actualizado el 24 de noviembre de 2026.**  
**Avance global** · 25,3 % (6 de 34 especificaciones completas).

El avance global es la media de los 34 porcentajes. Cada porcentaje refleja grupos de aceptación implementados y comprobados. El 100 % exige completar todos los criterios y las validaciones aplicables.

## Alcance y dependencias

La solicitud del 24 de noviembre de 2026 autoriza implementar, comprobar y avanzar por las 34 SPECS. Se revisaron ambos AGENTS, el [Documento Maestro v1.1](DOCS/Comisariato%20Mi%20Comercio%20Web.pdf) de 24 páginas, las 34 SPECS y su [índice](SPECS/SPEC.md).

SPEC-010 requiere variantes de SPEC-012 y también consume el historial y carrito de SPECS 021 y 016. Sus entregas se retoman cuando existan esos módulos. Las acciones de franjas que reservan y liberan cupos se validan con la creación y cancelación de pedidos. Los aportes de Picking, dominio, credenciales externas y contenido oficial quedan pendientes. La demostración usa datos sintéticos identificados y mantiene bloqueados los pedidos reales.

## Estado de las 34 SPECS

| SPEC | Alcance | Dependencias declaradas | Estado | Avance |
| --- | --- | --- | --- | ---: |
| [SPEC-001](SPECS/SPEC-001.md) | Inicialización y entornos | Ninguna | COMPLETADA | 100 % |
| [SPEC-002](SPECS/SPEC-002.md) | Arquitectura, contratos y datos simulados | SPEC-001 | COMPLETADA | 100 % |
| [SPEC-003](SPECS/SPEC-003.md) | Sistema de diseño y componentes UI | SPEC-001 | EN VALIDACIÓN | 90 % |
| [SPEC-004](SPECS/SPEC-004.md) | Sitemap, layouts y navegación | SPEC-001, SPEC-003 | EN VALIDACIÓN | 90 % |
| [SPEC-005](SPECS/SPEC-005.md) | Modelo web, seguridad de acceso y auditoría | SPEC-001, SPEC-002 | COMPLETADA | 100 % |
| [SPEC-006](SPECS/SPEC-006.md) | Registro de clientes y validación | SPEC-005, SPEC-003 | COMPLETADA | 100 % |
| [SPEC-007](SPECS/SPEC-007.md) | Verificación de correo con código | SPEC-006 | COMPLETADA | 100 % |
| [SPEC-008](SPECS/SPEC-008.md) | Login, sesiones y recuperación | SPEC-005, SPEC-007 | COMPLETADA | 100 % |
| [SPEC-009](SPECS/SPEC-009.md) | Mi perfil y seguridad de cuenta | SPEC-008, SPEC-005 | EN VALIDACIÓN | 80 % |
| [SPEC-010](SPECS/SPEC-010.md) | Favoritos y repetición de compras | SPEC-008, SPEC-012 | BLOQUEADA | 0 % |
| [SPEC-011](SPECS/SPEC-011.md) | Catálogo, categorías y fichas | SPEC-002, SPEC-003, SPEC-004 | PENDIENTE | 0 % |
| [SPEC-012](SPECS/SPEC-012.md) | Variantes y presentaciones | SPEC-002, SPEC-011 | PENDIENTE | 0 % |
| [SPEC-013](SPECS/SPEC-013.md) | Búsqueda, filtros y ordenamiento | SPEC-004, SPEC-011 | PENDIENTE | 0 % |
| [SPEC-014](SPECS/SPEC-014.md) | Promociones y precios de oferta | SPEC-002, SPEC-011 | PENDIENTE | 0 % |
| [SPEC-015](SPECS/SPEC-015.md) | Recomendaciones en ficha de producto | SPEC-011, SPEC-012 | PENDIENTE | 0 % |
| [SPEC-016](SPECS/SPEC-016.md) | Carrito persistente de visitante y cliente | SPEC-005, SPEC-011, SPEC-012 | PENDIENTE | 0 % |
| [SPEC-017](SPECS/SPEC-017.md) | Resumen final y revisión de precios | SPEC-016, SPEC-008, SPEC-002 | PENDIENTE | 0 % |
| [SPEC-018](SPECS/SPEC-018.md) | Horarios y calendario operativo | SPEC-005 | PENDIENTE | 0 % |
| [SPEC-019](SPECS/SPEC-019.md) | Franjas de retiro y cupos | SPEC-018, SPEC-005 | PENDIENTE | 0 % |
| [SPEC-020](SPECS/SPEC-020.md) | Creación de pedidos e idempotencia | SPEC-005, SPEC-008, SPEC-016, SPEC-017, SPEC-018, SPEC-019 | PENDIENTE | 0 % |
| [SPEC-021](SPECS/SPEC-021.md) | Seguimiento e historial de pedidos | SPEC-008, SPEC-020 | PENDIENTE | 0 % |
| [SPEC-022](SPECS/SPEC-022.md) | Cancelaciones de cliente y administrador | SPEC-020, SPEC-021 | PENDIENTE | 0 % |
| [SPEC-023](SPECS/SPEC-023.md) | Máquina de estados y coordinación manual | SPEC-020, SPEC-022 | PENDIENTE | 0 % |
| [SPEC-024](SPECS/SPEC-024.md) | Notificaciones internas del cliente | SPEC-005, SPEC-021, SPEC-023 | PENDIENTE | 0 % |
| [SPEC-025](SPECS/SPEC-025.md) | Dashboard inicial y alertas de nuevos pedidos | SPEC-005, SPEC-020, SPEC-023 | PENDIENTE | 0 % |
| [SPEC-026](SPECS/SPEC-026.md) | Administración de pedidos y clientes | SPEC-005, SPEC-020, SPEC-022, SPEC-023 | PENDIENTE | 0 % |
| [SPEC-027](SPECS/SPEC-027.md) | Catálogo editorial e imágenes | SPEC-005, SPEC-011 | PENDIENTE | 0 % |
| [SPEC-028](SPECS/SPEC-028.md) | Banners y campañas visuales CMS | SPEC-005, SPEC-003, SPEC-027 | PENDIENTE | 0 % |
| [SPEC-029](SPECS/SPEC-029.md) | CMS de páginas, FAQs y SEO editable | SPEC-004, SPEC-005, SPEC-003 | PENDIENTE | 0 % |
| [SPEC-030](SPECS/SPEC-030.md) | Configuración administrativa y excepciones | SPEC-018, SPEC-019, SPEC-025 | PENDIENTE | 0 % |
| [SPEC-031](SPECS/SPEC-031.md) | Analítica de pedidos y ventas Picking | SPEC-002, SPEC-025 | PENDIENTE | 0 % |
| [SPEC-032](SPECS/SPEC-032.md) | Analítica de inventario Picking | SPEC-002, SPEC-025 | PENDIENTE | 0 % |
| [SPEC-033](SPECS/SPEC-033.md) | Adaptador Picking, disponibilidad y modo seguro | SPEC-002, SPEC-011, SPEC-014, SPEC-017, SPEC-031, SPEC-032 | PENDIENTE | 0 % |
| [SPEC-034](SPECS/SPEC-034.md) | Seguridad, accesibilidad, SEO, QA y preparación de entrega | SPEC-003, SPEC-004, SPEC-005, SPEC-006, SPEC-008, SPEC-013, SPEC-020, SPEC-023, SPEC-024, SPEC-025, SPEC-026, SPEC-027, SPEC-028, SPEC-029, SPEC-030, SPEC-033 | PENDIENTE | 0 % |

## Registro de implementación y verificación

### SPEC-001 · Inicio

- Base encontrada. Next.js 16.4.6, App Router con layout raíz, TypeScript estricto, Tailwind, ESLint y repositorio Git en main.
- Aceptación pendiente. Configuración separada por entorno, estructura pública/privada/admin, rutas de diagnóstico, indicadores de demostración, contrato de Supabase y comprobación del cierre comercial.
- Validación prevista. Inicio limpio, lint, tipos, build, navegador, rutas protegidas y ausencia de un valor de prueba privilegiado en los recursos del cliente.

- Implementación. Grupos de rutas, portada, diagnóstico, 404, tokens iniciales, configuración privada de Supabase y bloqueo comercial sin interruptor de activación.
- Archivos. `app/`, `lib/server/`, `.env.example`, `next.config.ts`, `README.md`, `package.json`, `package-lock.json`, `playwright.config.ts` y `tests/e2e/spec-001.spec.ts`.
- Validación en curso. Instalación reproducible, arranque, navegador, accesibilidad y escaneo de exposición.

- Verificado en Windows, Node 26.2.0, npm 11.13.0 y Microsoft Edge. `npm ci`, `npm run lint -- --max-warnings=0`, `npm run typecheck` y `npm run build` pasaron. Tres pruebas Playwright comprobaron navegación por teclado, reflow a 320 px, axe sin incidencias, respuesta privada 404, no indexación e inexistencia del marcador privilegiado en HTML y scripts.
- El proyecto de Supabase remoto queda pendiente de credenciales aisladas. SPEC-001 valida el arranque con la configuración vacía y deja el SDK preparado para la fase de persistencia.

### SPEC-002 · Inicio

- Aceptación. Catálogo ficticio sin red, procedencia y vigencia explícitas, interfaz comercial sustituible y bloqueo real del lado servidor.
- Diseño. La presentación consume un servicio de aplicación. Los contratos excluyen protocolo y credenciales. La implementación de demostración vive en el servidor y expone resultados tipados de éxito, vacío, fallo, caducidad y acceso restringido.

- Implementación. Contratos comerciales de catálogo, variante, dinero, promoción, inventario y ventas. Adaptador simulado intercambiable; lectura con estados explícitos; datos ausentes como nulos, ventas e inventario restringidos por actor y fuente real cerrada.
- Archivos. `lib/commercial/`, `lib/server/commercial/`, diagnóstico y pruebas de contratos y navegador.

- Verificado. Lint sin advertencias, tipos y build pasaron. Cuatro pruebas de contrato confirmaron datos actuales, vacíos, caducados y fallidos, promociones vencidas y permisos. Cuatro pruebas Playwright pasaron, incluida la lectura del catálogo simulado sin servicios externos.
- Picking real queda pendiente de contrato autorizado. La lectura simulada y el cierre comercial satisfacen esta fase.

### SPEC-003 · Inicio

- Diseño. Tokens semánticos de marca, tipografías locales Manrope e Inter, Lucide, controles nativos y galería de prueba. Movimiento CSS de 200 ms y alternativa instantánea con movimiento reducido.
- Aceptación. Estados y variantes semánticas, contraste, controles táctiles, reflow, diálogo con foco recuperable y verificación accesible.

- Implementación. Biblioteca de botones, enlaces, campos, tarjetas, avisos, diálogo, vacío, carga y tipografías. La galería permite probar estados y el diagnóstico enlaza a ella.
- Archivos. `components/ui/`, `app/globals.css`, `app/layout.tsx`, `app/(public)/diagnostico/`, `DOCS/sistema-diseno.md` y `tests/e2e/spec-003.spec.ts`.

- Verificado. Lint, tipos, build, 4 pruebas unitarias y 6 pruebas Playwright pasaron. Se revisaron capturas a 320 y 1440 px; axe y reflow pasaron a 320, 768 y 1440 px, junto con nombres accesibles, objetivos táctiles, foco, Escape y movimiento reducido.
- Errores corregidos. Se usaron las exportaciones reales de Fontsource y se ajustó la capa CSS del token para que la preferencia reducida prevalezca.
- Pendiente. Recorrido interactivo con un lector de pantalla. La comprobación semántica automatizada permite usar los componentes ya verificados en SPEC-004, pero se mantiene abierta la validación asistida.

### SPEC-004 · Inicio

- Aceptación. Navegación pública por teclado y pantallas estrechas, estructura de cuenta y administración cerrada hasta autenticación, estados de error y contador de carrito.
- Diseño. Cabecera sticky con destinos de compra, enlaces contextuales y pie institucional. Búsqueda y filtros representados en la URL para conservar el historial. El contador consume el estado inicial de carrito de visitante; la sincronización con cuentas corresponde a SPEC-016.

- Implementación. Cabecera sticky, navegación móvil con Escape y retorno de foco, pie, migas, búsqueda inicial, rutas informativas con marcadores confirmados, estado de error y contador de carrito.
- Archivos. `components/storefront/`, `lib/navigation.ts`, `lib/cart/guest.ts`, rutas del grupo público y pruebas SPEC-004.

- Verificado. Lint, tipos, build, 5 pruebas unitarias y 8 Playwright pasaron. La regresión comprueba menú móvil a 320 px, teclado, Escape, salto al contenido, búsqueda, contador, vuelta a URL filtrada, respuestas no indexables y 404.
- Pendiente. Validar retorno a la posición de catálogo desde una ficha real tras SPEC-011 y los accesos autenticados cuando estén las SPECS 005 y 008. Las rutas reservadas siguen cerradas.

### SPEC-005 · Inicio

- Aceptación. Modelo Supabase/PostgreSQL con consistencia de cuenta, privacidad por propietario, administrador explícito, auditoría y cupos atómicos.
- Diseño. Datos web separados del adaptador comercial, RLS por usuario, asignación de administración reservada y restricciones de unicidad e integridad. Validación con fixtures en PostgreSQL local independiente de la configuración remota.

- Implementación. Migración con tablas web, claves, restricciones, RLS, asignación administrativa, auditoría sin datos de fila y cupos transaccionales. El trigger de reserva se ejecuta tras insertar para evitar efectos en inserciones ignoradas.
- Archivos. `supabase/config.toml`, `supabase/migrations/`, `DOCS/modelo-web.md`, `tests/db/web-model.test.ts` y dependencias de pruebas.
- Pruebas en curso. WSL no está registrado y Docker no está instalado. Se usa PostgreSQL 17 embebido para validar SQL con dos conexiones independientes. El selector npm instalado requirió una versión explícita del empaquetador.

- Verificado en PostgreSQL 17.12. Cuatro pruebas pasaron con conexiones reales: aislamiento por propietario, administración, auditoría, índices únicos, permisos y competencia por el último cupo. Lint, tipos, 5 unitarias, build y 8 Playwright pasaron.
- Alcance de la evidencia. PostgreSQL ejecuta la migración real sobre un esquema de identidad de prueba compatible con `auth.uid()`. La conexión completa con Supabase Auth y el correo de producción se validará por separado.

### SPEC-006 · Inicio

- Aceptación. Alta con seis campos, validación cliente y servidor, cédula textual con ceros iniciales, justificación de consentimiento de demostración, unicidad y perfil pendiente.
- Diseño. Supabase Auth recibe la contraseña y PostgreSQL crea el perfil en la misma transacción de alta. El aviso de demo evita tratar el borrador de privacidad como texto oficial.

- Implementación. Formulario accesible con seis campos y aviso de prueba, validación compartida y acción de servidor. Una transacción de Auth crea el perfil, preserva la cédula como texto y elimina el duplicado de los datos sensibles en los metadatos.
- Archivos. `app/(public)/registro/`, `lib/account/registration.ts`, `lib/server/supabase.ts`, migración de alta y pruebas unitarias, SQL y Playwright.
- Pendiente de evidencia. Recorrido de alta con Supabase Auth real de prueba. Se está preparando el proveedor de código abierto local, ya que la CLI tradicional requiere Docker.

- Verificado. Lint, tipos, 7 unitarias, 5 PostgreSQL, build, 10 Playwright y alta con Auth/PostgREST/SMTP local pasaron. La prueba real confirmó creación pendiente, rechazo de duplicados y ausencia de datos de registro en los metadatos persistidos.
- Correcciones. Cédula con tipo explícito, roles y esquema de conexión del proveedor local, y limpieza de metadatos persistidos de usuario e identidades. En Windows la compilación temporal del proveedor Auth usa la escucha TCP estándar y PostgREST carga las DLL de PostgreSQL. Se usaron únicamente identidades de prueba.

### SPEC-007 · Inicio

- Aceptación. Código de 6 dígitos, temporal, de un solo uso y ligado al correo. Reenvío e intentos limitados; una verificación no inicia la sesión habitual.
- Diseño. Supabase emite y consume el código; el perfil sincroniza la confirmación dentro de la transacción. La aplicación muestra estados accesibles y no conserva el código ni el token de acceso.

- Implementación. Formulario de código, plantilla de confirmación, reenvío de Supabase con 60 segundos, código de 10 minutos y sincronización atómica del perfil. La confirmación usa un cliente efímero y el acceso habitual conserva correo y contraseña.
- Archivos. `app/(public)/verificar/`, `supabase/templates/confirmation.html`, configuración de Auth, migración de sincronización y pruebas de UI e integración.

- Verificado. Lint, tipos, 7 unitarias, 5 PostgreSQL, build y 11 Playwright pasaron. La integración real local confirmó código de seis dígitos, destinatario, expiración, reenvío, uso único, perfil verificado y ausencia de sesión de navegador tras confirmar.
- Corrección en el entorno de prueba. El gateway fija el origen de cada solicitud local y Supabase aplica su límite tras la ráfaga inicial. Se verificó HTTP 429 y el aviso correspondiente; el límite y la configuración del gateway deben conservarse en cualquier entorno desplegado.

### SPEC-008 · Inicio

- Aceptación. Acceso y cierre de sesión, caducidad, rechazo uniforme, retorno local y recuperación por enlace. La cuenta y el administrador se autorizan en el servidor.
- Diseño. Sesiones Supabase en cookies HttpOnly. La recuperación usa PKCE y conserva su sesión aislada de la navegación de cuenta. El proveedor verifica credenciales; la base verifica usuario habilitado, sesión vigente y asignación administrativa.

- Implementación. Acceso, cierre, recuperación por enlace PKCE, cookies HttpOnly, verificación de perfil/sesión y acceso administrativo, retorno acotado y conservación de carrito.
- Archivos. Rutas de autenticación y cuenta, `proxy.ts`, `lib/server/account.ts`, utilidades de cookies/credenciales, configuración Auth, plantilla de recuperación y migración de sesiones.

- Verificado. Lint, tipos, 9 unitarias, 5 PostgreSQL y build pasaron. La regresión final completó 12 Playwright. La integración local confirmó inicio con cuenta verificada, contraseña incorrecta y correo desconocido con texto uniforme, retorno al carrito, administración revocable, sesión vencida, recuperación sin sesión de cuenta, revocación de sesiones y cierre.
- Errores corregidos. Las rutas privadas pasaron de prerender a evaluación por solicitud. El gateway local se configuró con rol autenticado y ruta de verificación de correo. Se estabilizó el formulario de recuperación antes de hidratar.

### SPEC-009 · Inicio

- Aceptación. Lectura y edición de datos propios, cédula inmutable, cambio de correo verificado y cambio de contraseña autenticado.
- Diseño. RLS y RPC acotada para contacto, revisión optimista con fecha de versión y verificación del proveedor para las credenciales.

- Implementación. Cuenta con datos propios, cédula de solo lectura, edición de contacto con control de versión, nueva verificación de correo en ambos buzones y cambio de contraseña con confirmación de la actual.
- Archivos. `app/(private)/cuenta/`, `app/auth/correo/route.ts`, migración de contacto, configuración Auth y pruebas de persistencia e integración.
