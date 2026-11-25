# Progreso de Comisariato Mi Comercio Web

**Actualizado el 25 de noviembre de 2026.**

**Avance global** · 98,9 % (27 de 34 especificaciones completas).

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
| [SPEC-004](SPECS/SPEC-004.md) | Sitemap, layouts y navegación | SPEC-001, SPEC-003 | COMPLETADA | 100 % |
| [SPEC-005](SPECS/SPEC-005.md) | Modelo web, seguridad de acceso y auditoría | SPEC-001, SPEC-002 | COMPLETADA | 100 % |
| [SPEC-006](SPECS/SPEC-006.md) | Registro de clientes y validación | SPEC-005, SPEC-003 | COMPLETADA | 100 % |
| [SPEC-007](SPECS/SPEC-007.md) | Verificación de correo con código | SPEC-006 | COMPLETADA | 100 % |
| [SPEC-008](SPECS/SPEC-008.md) | Login, sesiones y recuperación | SPEC-005, SPEC-007 | COMPLETADA | 100 % |
| [SPEC-009](SPECS/SPEC-009.md) | Mi perfil y seguridad de cuenta | SPEC-008, SPEC-005 | COMPLETADA | 100 % |
| [SPEC-010](SPECS/SPEC-010.md) | Favoritos y repetición de compras | SPEC-008, SPEC-012 | COMPLETADA | 100 % |
| [SPEC-011](SPECS/SPEC-011.md) | Catálogo, categorías y fichas | SPEC-002, SPEC-003, SPEC-004 | COMPLETADA | 100 % |
| [SPEC-012](SPECS/SPEC-012.md) | Variantes y presentaciones | SPEC-002, SPEC-011 | COMPLETADA | 100 % |
| [SPEC-013](SPECS/SPEC-013.md) | Búsqueda, filtros y ordenamiento | SPEC-004, SPEC-011 | COMPLETADA | 100 % |
| [SPEC-014](SPECS/SPEC-014.md) | Promociones y precios de oferta | SPEC-002, SPEC-011 | COMPLETADA | 100 % |
| [SPEC-015](SPECS/SPEC-015.md) | Recomendaciones en ficha de producto | SPEC-011, SPEC-012 | COMPLETADA | 100 % |
| [SPEC-016](SPECS/SPEC-016.md) | Carrito persistente de visitante y cliente | SPEC-005, SPEC-011, SPEC-012 | COMPLETADA | 100 % |
| [SPEC-017](SPECS/SPEC-017.md) | Resumen final y revisión de precios | SPEC-016, SPEC-008, SPEC-002 | COMPLETADA | 100 % |
| [SPEC-018](SPECS/SPEC-018.md) | Horarios y calendario operativo | SPEC-005 | COMPLETADA | 100 % |
| [SPEC-019](SPECS/SPEC-019.md) | Franjas de retiro y cupos | SPEC-018, SPEC-005 | COMPLETADA | 100 % |
| [SPEC-020](SPECS/SPEC-020.md) | Creación de pedidos e idempotencia | SPEC-005, SPEC-008, SPEC-016, SPEC-017, SPEC-018, SPEC-019 | COMPLETADA | 100 % |
| [SPEC-021](SPECS/SPEC-021.md) | Seguimiento e historial de pedidos | SPEC-008, SPEC-020 | COMPLETADA | 100 % |
| [SPEC-022](SPECS/SPEC-022.md) | Cancelaciones de cliente y administrador | SPEC-020, SPEC-021 | COMPLETADA | 100 % |
| [SPEC-023](SPECS/SPEC-023.md) | Máquina de estados y coordinación manual | SPEC-020, SPEC-022 | COMPLETADA | 100 % |
| [SPEC-024](SPECS/SPEC-024.md) | Notificaciones internas del cliente | SPEC-005, SPEC-021, SPEC-023 | EN VALIDACIÓN | 95 % |
| [SPEC-025](SPECS/SPEC-025.md) | Dashboard inicial y alertas de nuevos pedidos | SPEC-005, SPEC-020, SPEC-023 | COMPLETADA | 100 % |
| [SPEC-026](SPECS/SPEC-026.md) | Administración de pedidos y clientes | SPEC-005, SPEC-020, SPEC-022, SPEC-023 | COMPLETADA | 100 % |
| [SPEC-027](SPECS/SPEC-027.md) | Catálogo editorial e imágenes | SPEC-005, SPEC-011 | EN VALIDACIÓN | 95 % |
| [SPEC-028](SPECS/SPEC-028.md) | Banners y campañas visuales CMS | SPEC-005, SPEC-003, SPEC-027 | EN VALIDACIÓN | 95 % |
| [SPEC-029](SPECS/SPEC-029.md) | CMS de páginas, FAQs y SEO editable | SPEC-004, SPEC-005, SPEC-003 | EN VALIDACIÓN | 97 % |
| [SPEC-030](SPECS/SPEC-030.md) | Configuración administrativa y excepciones | SPEC-018, SPEC-019, SPEC-025 | COMPLETADA | 100 % |
| [SPEC-031](SPECS/SPEC-031.md) | Analítica de pedidos y ventas Picking | SPEC-002, SPEC-025 | COMPLETADA | 100 % |
| [SPEC-032](SPECS/SPEC-032.md) | Analítica de inventario Picking | SPEC-002, SPEC-025 | COMPLETADA | 100 % |
| [SPEC-033](SPECS/SPEC-033.md) | Adaptador Picking, disponibilidad y modo seguro | SPEC-002, SPEC-011, SPEC-014, SPEC-017, SPEC-031, SPEC-032 | EN VALIDACIÓN | 97 % |
| [SPEC-034](SPECS/SPEC-034.md) | Seguridad, accesibilidad, SEO, QA y preparación de entrega | SPEC-003, SPEC-004, SPEC-005, SPEC-006, SPEC-008, SPEC-013, SPEC-020, SPEC-023, SPEC-024, SPEC-025, SPEC-026, SPEC-027, SPEC-028, SPEC-029, SPEC-030, SPEC-033 | EN VALIDACIÓN | 93 % |

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

- Verificado. Pasaron lint, tipos, 9 unitarias, 6 PostgreSQL, build y 12 Playwright. La prueba integrada de SPEC-009 pasó con la edición de datos propios, rechazo de correo duplicado, doble confirmación y cambio de contraseña. Se precisó el selector de la prueba para distinguir la sección desplegable de su botón.
- SPEC-010 queda aplazada por las dependencias ya registradas. Se retoma la parte de favoritos tras SPEC-012 y la repetición cuando existan carrito e historial.

### SPEC-011 · Inicio

- Aceptación. Visitantes pueden recorrer las categorías y fichas, consultar disponibilidad y agregar una presentación vendible al carrito de demostración.
- Diseño. La capa editorial suministra fotos y descripción de muestra. Precio, existencia y SKU pertenecen al adaptador comercial simulado.

- Implementación. Catálogo con paginación, fichas, migas, foto generada de la bolsa de 1 kg, datos ausentes y agregado al carrito por SKU.
- Archivos. Rutas `catalogo` y `producto/[slug]`, componentes de catálogo, utilidades comerciales y de carrito, imagen WebP de prueba y regresiones unitarias y de navegador.

- Verificado. Pasaron lint, tipos, 11 unitarias, build y 14 Playwright. La evidencia incluye paginación con 1.001 registros sintéticos, navegación móvil con teclado, descarga real del WebP, regreso a la URL filtrada, agregado y estados agotado, sin foto y sin precio.
- Queda pendiente corroborar la restauración de la posición vertical en SPEC-004.

### SPEC-012 · Inicio

- Aceptación. Cada presentación actualiza identidad, unidad, precio, stock y límite. El carrito conserva el SKU y rechaza valores fraccionarios o que superen el límite acumulado.

- Implementación. La ficha muestra stock y límite de la presentación elegida. Una única foto se vincula al SKU correspondiente. Se devuelve el foco al selector o cantidad cuando hay un error.
- Archivos. `product-purchase.tsx`, fixture de caja, prueba de variantes y regresión de posición del catálogo.

- Verificado. Pasaron lint, tipos, 11 unitarias, build y 15 Playwright. Se cubrieron selección obligatoria, cantidad fraccionaria y límites acumulados, precio y stock diferenciados, y líneas separadas por SKU.
- Se completa SPEC-004. La regresión volvió desde la ficha a la URL filtrada y restauró su posición vertical. La autorización real ya se verificó en SPEC-008.

### SPEC-010 · Favoritos

- Se retoma ahora que existe la ficha y sus variantes. La repetición depende todavía de carrito sincronizado e historial de pedidos.

- Favoritos verificados. Guardar, listar y quitar desde la cuenta funcionaron en integración con Supabase local. La prueba SQL confirmó que otra cuenta no puede leer, insertar o borrar esos registros. La regresión pasó con 11 unitarias, 7 PostgreSQL y 15 Playwright.
- Queda por implementar repetir pedidos con los precios y existencias vigentes. Se retoma tras SPEC-016 y SPEC-021.

### SPEC-013 · Inicio

- Aceptación. Búsqueda con sugerencias navegables por teclado, filtros combinables por datos de catálogo, orden, total, paginación y regreso a la consulta.

- Implementación. Sugerencias por teclado con miniatura y precio, coincidencias por nombre y marca, filtros combinables, orden estable, contador y paginación en la URL.
- Archivos. `app/(public)/buscar/`, API de sugerencias, `search-box.tsx`, `search.ts` y pruebas de búsqueda.

- Verificado. Pasaron lint, tipos, 13 unitarias, build y 17 Playwright. Se cubrieron acentos, marcas, caracteres especiales, filtros combinables, total, navegación por teclado y axe en las sugerencias.
- Incidencias corregidas. Escape cierra las sugerencias conservando la consulta. El enlace explícito de regreso evita que el navegador omita una entrada intermedia del historial y conserva filtros, orden y página en una URL local validada.

### SPEC-014 · Inicio

- Aceptación. Las ofertas muestran datos vigentes de origen, con comparación solo cuando se verifica; el carrito detecta cambios posteriores.

- Implementación. Página de ofertas y filtros, precio fuente vigente, comparación del mismo SKU y moneda, fechas y condiciones. El carrito retiene el importe observado y consulta los precios actuales al abrirse.
- Archivos. `pricing.ts`, `product-price.tsx`, `promociones/`, API de cotización, estado del carrito y pruebas.
- Decisión. Una oferta sin precio anterior válido muestra el precio actual sin porcentaje. Ofertas simultáneas sin prioridad verificable conservan el precio base. La reconfirmación al enviar se valida en SPEC-017.

- Verificado. Pasaron lint, tipos, 15 unitarias, build y la prueba específica de comparación y vigencia en ficha y aviso de cambio en el carrito. Las 17 regresiones previas pasaron en la primera ejecución; la prueba nueva se ajustó para esperar la navegación antes de recargar.
- La oferta actual se consume con datos de demostración. No se introdujo una conexión con Picking.

### SPEC-015 · Inicio

- Aceptación. Recomendar productos que tengan una variante disponible, con ubicación exclusiva en la ficha y sin bloque vacío.

- Implementación. Recomendación por categoría y relaciones de demo, acotada a productos distintos con precio y stock disponibles. La ficha oculta la sección cuando no hay candidatos.
- Archivos. `recommendations.ts`, ficha, tarjetas y pruebas de selección y vista móvil.

- Verificado. Lint, tipos, build, 16 unitarias y 19 Playwright. Los candidatos inválidos quedan fuera; el bloque aparece solo en fichas con alternativas y está ausente del carrito.

### SPEC-016 · Inicio

- Aceptación. Mostrar y editar líneas por SKU, conservar el carrito de visitante al cerrar o acceder, sincronizar con propiedad de cuenta, y preservar las líneas ante errores.
- Diseño. El navegador mantiene las líneas anónimas. La cuenta usa PostgreSQL con operaciones por propietario y reintentos idempotentes. Al combinar el mismo SKU se conserva la mayor cantidad y ambas selecciones quedan representadas sin duplicar unidades.

- Implementación. Carrito con líneas editables, subtotal y total, aviso de cotización, estado vacío, persistencia local de visitante y migración a cuenta verificada. Guardado remoto por RPC con recibo idempotente y límite de cantidad calculado por el servidor.
- Archivos. `carrito/`, API de cotización y cuenta, vista y estado del carrito, migración y pruebas.
- Pendiente por dependencia. Validar que crear el pedido limpie solo el subconjunto enviado en SPEC-020.

- Verificado. Pasaron lint, tipos, build, 16 unitarias, 8 PostgreSQL y 21 Playwright. La integración confirmó que el carrito anónimo se conserva al iniciar sesión, se sincroniza con la cuenta y reaparece al recargar. La prueba SQL cubrió deduplicación, límites y rollback.
- Queda pendiente la eliminación selectiva tras persistir un pedido en SPEC-020. El carrito ya está disponible para la revisión de importes.

### SPEC-017 · Inicio

- Aceptación. Vista revisable con importe por línea, estimación en unidades menores y pago en caja. El servidor debe rechazar una aceptación que haya quedado obsoleta y conservar el carrito.

- Implementación. Revisión autenticada con precios y stock vigentes, importe entero por línea, marca de revisión, persistencia de la aceptación y revalidación antes de guardarla. Si cambian las líneas, se vuelve a mostrar el resumen.
- Archivos. `lib/cart/review.ts`, utilidades de estimación, servicio de revisión, ruta `/pedido/confirmar`, migración de revisiones y pruebas.
- Dependencia. La hora de retiro y la transferencia de la instantánea al pedido se completan con SPEC-019 y SPEC-020.

- Verificado. Pasaron lint, tipos, build, 18 unitarias, 8 PostgreSQL y 21 Playwright. La integración detectó el cambio de 4,20 a 6,30, pidió revisar otra vez y persistió el importe aceptado de 630 unidades menores en la base. Se mantiene el carrito.
- Pendiente. La franja y la instantánea del pedido real de prueba se conectan en las siguientes SPECS.

### SPEC-018 · Inicio

- Aceptación. Horarios de Portoviejo, zona America/Guayaquil, límites exclusivos de cierre y administración de pausas y fechas especiales con aviso y auditoría.

- Implementación. Horario habitual, resolución de la hora y ventana web desde PostgreSQL, pausas y excepciones auditadas, edición protegida y aviso público. El sitio informa el horario habitual aunque falte la configuración de la base.
- Archivos. Migración de calendario, `/admin/calendario`, `/horarios` y pruebas.

- Verificado. Pasaron lint, tipos, build, 18 unitarias, 9 PostgreSQL y 21 Playwright. La integración comprobó pausa editada por el administrador y aviso público. SQL cubrió apertura y cierre exactos en Guayaquil, domingo, feriado, reactivación y rechazo de cambios por clientes.

### SPEC-019 · Inicio

- Aceptación. Mostrar únicamente franjas del mismo día, de 15 minutos y con 30 minutos de anticipación, capacidad y ausencia de pedido activo. Configurar capacidad y cierres sin modificar reservas existentes.

- Implementación. PostgreSQL calcula las franjas sin reservar. La vista permite seleccionarlas, presenta disponibilidad y deja la capacidad inicial en cero hasta que el administrador la configure. Cambios de cupo y cierres conservan reservas.
- Archivos. Migración de franjas, selector en revisión, editor administrativo y regresiones.

- Verificado. Pasaron lint, tipos, build, 18 unitarias, 10 PostgreSQL y 21 Playwright. SQL comprobó 10:07 → 10:45, límite del domingo, cierre, cupo cero, reservas concurrentes, liberación y permisos. En integración se guardó la capacidad y se mostró el estado sin franjas.

### SPEC-020 · Inicio

- Aceptación. Registrar un pedido de demostración una sola vez, con franja e instantánea aceptada. Cualquier error conserva el carrito. El servidor comercial real sigue desactivado.
- Diseño. El endpoint autentica al cliente, verifica el catálogo de origen simulado y usa un escritor solo de servidor. PostgreSQL vuelve a verificar cantidad y cupo dentro de la transacción y elimina exclusivamente las líneas incluidas.

- Implementación. Botón de envío solo para demostración, reintentos con el mismo UUID, consulta de recibo, validación final de sesión, precio, horario y franja, persistencia de cabecera/líneas/evento y limpieza selectiva.
- Archivos. API de pedidos, formulario y recibo, credencial opcional de servidor, migración transaccional y pruebas.

- Verificado. Pasaron lint, tipos, build, 18 unitarias, 11 pruebas de PostgreSQL y 21 pruebas Playwright. La integración en navegador registró un solo pedido, interrumpió la respuesta, recuperó el mismo recibo, verificó el total y confirmó la persistencia en estado Pendiente.
- Se completan SPEC-016 y SPEC-017. PostgreSQL conservó las líneas ajenas al envío y guardó la instantánea aprobada. Ante cupo perdido, horario cerrado o revisión inválida, la transacción conservó el carrito. Se corrigió una espera en la regresión de recuperación de contraseña.

### SPEC-021 · Inicio

- Aceptación. La cuenta muestra su pedido activo e historial. El detalle incluye franja, importes guardados y línea de tiempo. Las URL ajenas deben quedar denegadas y los estados activos se actualizan sin recarga obligatoria.

- Implementación. Vistas de pedido activo, historial paginado, detalle con instantánea y franja histórica, actualización al recuperar foco y cada 15 segundos. El recibo enlaza al detalle.
- SPEC-010 se retoma. La repetición reconstruye el carrito con el catálogo vigente, avisa sobre líneas no disponibles y conserva las líneas existentes. PostgreSQL comprueba propiedad, estado terminal y ausencia de pedido activo.
- Archivos. Rutas de cuenta y pedidos, componentes de seguimiento, migraciones de historial y repetición, regresiones unitarias e integración.

SPEC-010 y SPEC-021. La prueba nativa de navegador confirmó propiedad del historial, actualización de estado, productos vigentes y repetición sin crear pedidos ni eliminar líneas del carrito.

SPEC-022. Cancelación con comparación de estado, auditoría, motivos administrativos protegidos y liberación a través del disparador de cupos. Formularios de cliente y administrador. Pendiente ejecutar validaciones.

SPEC-022. Compilación de producción, ESLint, TypeScript y 12 pruebas de PostgreSQL correctas. Navegador nativo confirmó apertura por teclado, cancelación efectiva, cupo liberado y repetición posterior; PostgreSQL comprobó doble cancelación, conflicto de estado, acceso ajeno, privacidad del motivo y protección de Entregado.

SPEC-023. Acción administrativa secuencial con bloqueo por fila y auditoría, lista de preparación, coordinación verbal y doble confirmación explícita de cobro y retiro simulados. Pendiente verificación de base de datos y navegador.

SPEC-023. ESLint, TypeScript, compilación, 19 pruebas unitarias y 13 de PostgreSQL correctas. Navegador nativo recorrió los cuatro avances, rechazó la entrega sin confirmación y mostró el evento auditado de entrega de prueba. PostgreSQL cubrió dos pestañas, saltos, cancelación por faltante y control de rol.

SPEC-024. Cada evento de pedido genera un aviso interno para el propietario. Campana, listado, marcador de lectura y actualización al reconectar. Pendientes prueba del navegador y prueba interactiva con lector de pantalla.

SPEC-024. ESLint, TypeScript, compilación, 19 unitarias y 14 de PostgreSQL correctas. Navegador comprobó contador, propiedad, lectura y reconexión. PostgreSQL comprobó avisos únicos y lectura idempotente. Falta sesión interactiva con lector de pantalla. Se amplió la comprobación de SMTP a todo el flujo administrativo para la próxima regresión.

SPEC-025. Dashboard administrativo con contadores del día local, cola, franjas ocupadas, aviso de entorno y sonido explícitamente activable. Los enlaces comparten filtros de fecha/estado con la cola. Ventas e inventario reales pendientes de Picking.

SPEC-025. Compilación, ESLint, TypeScript, 19 unitarias y 14 pruebas PostgreSQL correctas. Navegador confirmó cola única, sonido activado con interacción, aviso visual y coherencia entre contador y filtro de fecha en Guayaquil. Quedan los accesos a analítica e inventario, sujetos a SPECS 031 y 032.

SPEC-026. Búsquedas autorizadas por formulario POST para evitar cédulas o correos en URL, filtros de pedido, vista con cédula enmascarada, historial y suspensión/reactivación con comparación de versión, auditoría y revocación de sesiones. Pendientes pruebas en PostgreSQL y navegador.

SPEC-026. Compilación, ESLint, TypeScript, 19 pruebas unitarias y 15 de PostgreSQL correctas. Navegador verificó búsqueda sin exponer la cédula en URL, dato enmascarado, suspensión, reactivación y rechazo de la sesión anterior. PostgreSQL comprobó auditoría, acceso ajeno y conflicto de edición.

SPEC-027. Fichas, categorías, destacados, visibilidad y galerías editoriales. Sharp valida el contenido y convierte imágenes, y las políticas de Storage restringen lectura a medios publicados. La validación de archivos se ejecuta por elemento. Pendientes regresión y transferencia real con Supabase Storage.

SPEC-027. ESLint, TypeScript, compilación y 16 pruebas PostgreSQL correctas. El navegador comprobó cambios públicos, destacados, ocultación de URL y rechazo de archivos por elemento. RLS de medios pasó en PostgreSQL con el esquema de prueba. Falta probar subida, descarga y reemplazo contra la API real de Supabase Storage, ausente del entorno nativo.

SPEC-028. Editor y vista previa de banners con dos resoluciones, ubicación, vigencia y orden. Publicación y lectura de imágenes limitadas por horario. Enlace a producto/categoría validado también al mostrar. Pruebas pendientes.

SPEC-028. Compilación, lint, tipos, 19 unitarias y 17 pruebas PostgreSQL correctas. Navegador verificó selección móvil, vista previa, destino retirado sin enlace y desactivación. PostgreSQL cubrió solapamiento, ventanas, orden, sección y control de acceso. Storage real sigue pendiente.

SPEC-029. CMS con borrador privado, vista previa, publicación optimista, SEO, bloques FAQ/historia, contacto y galería. La publicación legal exige registrar revisión. Los marcadores se conservan mientras falte información confirmada.

SPEC-029. Compilación, lint, tipos, 19 unitarias, 18 pruebas PostgreSQL y navegador correctos. Se verificó preview privada, publicación pública, SEO, texto literal, versiones concurrentes y requisito legal. La entrega de imágenes de galería queda pendiente junto con Storage; historia, contacto y textos oficiales siguen en espera.

SPEC-030. Se reutilizó el editor operativo existente. El horario semanal público se consulta desde la configuración y el administrador ve auditoría reciente. Pendiente confirmar el cambio de horario en navegador y repetir el checkout.

SPEC-030. Compilación, lint, tipos, unitarias y 18 pruebas PostgreSQL correctas. Navegador verificó el aviso de pausa, el registro de cambios, el horario semanal publicado tras editarlo y el recorrido completo de checkout. Se conserva la protección de reservas existentes.

SPEC-031. Analítica separada de pedidos web y ventas de caja simuladas. Períodos Guayaquil, devolución, netos y comparación; el panel distingue datos faltantes y conversión sin medición. Pendientes regresión y fuentes reales.

SPEC-031. La primera regresión de navegador y PostgreSQL confirmó períodos, permisos y separación de pedidos/ventas. Se añadió conversión de envío con intentos válidos deduplicados, tasa de cancelación y tiempos de preparación; falta regresión del agregado.

SPEC-031. 21 unitarias y 20 pruebas PostgreSQL correctas, incluida conversión con un único intento por clave, cohorte y acceso restringido. Se usa venta neta por transacción válida para ticket promedio. Permanecen pendientes los eventos de embudo anteriores al envío y los datos comerciales reales.

SPEC-032. Inventario simulado por variante con datos desconocidos, agotados, umbral de stock bajo elegido en el filtro, duplicados, disponibilidad publicada y valoración condicionada a costos. Se distingue falta de historial para rotación. Pendiente validación en navegador.

SPEC-032. Compilación, lint, tipos, 22 unitarias y 20 pruebas PostgreSQL correctas. Navegador comprobó stock cero, desconocido, filtro bajo con umbral, valoración sin costos y rechazo público. La rotación muestra indisponibilidad por ausencia de historial en la fuente simulada.

SPEC-033. Adaptador con plazo y cancelación, detección de identificadores repetidos, último catálogo verificado marcado como desactualizado durante fallos y dashboard de estado. Sin protocolo externo ni apertura comercial. Pendiente validar la recuperación simulada.

SPEC-033. Compilación, lint, tipos y 23 unitarias correctas. Se verificaron timeout, cancelación de lectura, copia marcada como desactualizada, bloqueo del envío con carrito conservado y recuperación. Picking real espera autorización técnica y fuente verificable.

SPEC-034. Matriz QA01–QA32, plan de cierre de piloto, cabeceras web, no indexación, pruebas de reflujo y restauración PostgreSQL local. npm audit de producción informó cero vulnerabilidades conocidas. Falta ejecutar la regresión final y completar verificaciones con servicios y dispositivos externos.

SPEC-031. Se añadieron pasos de visita, carrito, acceso y envío y señales de búsqueda, franja y rechazo. La demostración registra categorías y un identificador aleatorio de pestaña sin correo, cédula, texto de búsqueda ni identificador de cuenta. El agregado deduplica por pestaña y categoría. Pendiente verificación del recorrido.

Regresión de SPEC-025 y SPEC-031. El panel enlaza analítica e inventario. El navegador comprobó alerta visual con audio permitido y con reproducción rechazada. Se comprobó el embudo completo desde ficha hasta envío, deduplicación del intento y recuperación del recibo. PostgreSQL restauró un clúster aislado sin perder pedidos, cupos, eventos ni permisos. Las pruebas móviles usaron perfiles emulados de Android e iOS en Edge. La API oficial de Storage requiere un entorno compatible: su instalación en esta máquina falló porque fs-xattr excluye Windows.

Regresión final del 25 de noviembre de 2026. Compilación de Next.js, ESLint, TypeScript, 23 pruebas unitarias, 22 de PostgreSQL, 23 de Playwright en Edge y 5 de integración con Auth, PostgREST, SMTP local y navegador, todas correctas. Git diff --check sin errores. La matriz QA01–QA32 está en DOCS/verificacion-demo.md. Los cierres pendientes requieren lector interactivo, Android/iOS físicos, un entorno compatible con Storage y el piloto autorizado con dominio, datos oficiales e integración Picking.
