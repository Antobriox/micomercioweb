# Verificación de Comisariato Mi Comercio Web

La matriz sigue la sección 17. Los datos de todas las suites son de prueba. Los pedidos comerciales siguen deshabilitados. [Documento Maestro v1.1](Comisariato%20Mi%20Comercio%20Web.pdf)

## Ejecución

| Comando | Cobertura |
| --- | --- |
| `npm run lint -- --max-warnings=0` y `npm run typecheck` | Revisión estática y tipos |
| `npm run test:unit` | Contratos, precios, reglas y fallos simulados |
| `npm run test:db` | Migraciones, autorización, concurrencia y restauración local |
| `npm run build` y `npm run test:e2e` | Compilación, sitio público, accesibilidad automática y navegación |
| `npm run test:auth` | Supabase Auth, PostgREST, SMTP local de prueba y navegador. Requiere los binarios descritos en [modelo-web.md](modelo-web.md). |
| `npm audit --omit=dev` | Dependencias de producción |

## Regresión local del 25 de noviembre de 2026

Pasaron compilación, ESLint, TypeScript, 23 pruebas unitarias, 22 de PostgreSQL, 23 del sitio público en Playwright y 5 de integración con Supabase Auth, PostgREST y SMTP local. La revisión de dependencias de producción informó cero vulnerabilidades conocidas. La cobertura de teléfonos corresponde a perfiles emulados en Edge. La restauración de PostgreSQL se comprobó en un clúster temporal.

## Casos del Documento Maestro

**U** corresponde a [pruebas unitarias](../tests/unit). **BD** corresponde al [modelo y las migraciones](../tests/db/web-model.test.ts). **N** corresponde a [Playwright en el sitio público](../tests/e2e). **I** corresponde a la [integración con navegador y servicios locales](../tests/integration/supabase-auth.test.ts).

| Caso | Qué comprobar | Evidencia |
| --- | --- | --- |
| QA01 | Carrito durante acceso, error y envío; limpiar solo líneas aceptadas | N · SPEC-016. I · checkout. BD · envío atómico. |
| QA02 | Dos envíos simultáneos del mismo cliente | BD · unicidad de pedido activo e idempotencia. |
| QA03 | Dos clientes compiten por el último cupo | BD · clientes PostgreSQL independientes. |
| QA04 | Ventana del lunes a las 06:59, 07:00, 16:59 y 17:00 | BD · calendario y límites de apertura/cierre. |
| QA05 | Ventana del domingo a las 12:59 y 13:00 | BD · calendario y límite dominical. |
| QA06 | A las 10:07 la primera franja es 10:45; el servidor determina el tiempo | BD · franja mínima, zona y hora del servidor. I · selector de retiro. |
| QA07 | Reintento recupera el mismo pedido, cupo y aviso | I · checkout y recibo recuperado. BD · envío atómico, intentos y avisos únicos. |
| QA08 | Revisión y carrito al cambiar precio u oferta | U · revisión de carrito. I · checkout con precio previo. |
| QA09 | Sesión vencida y rechazo de pedido ajeno | I · acceso, sesiones e historial. BD · RLS. |
| QA10 | Datos comerciales caducados, caída, demora y retorno | U · contratos comerciales y modo seguro. Pendiente Picking autorizado. |
| QA11 | Salto de estado, automatismos y pestañas simultáneas | BD e I · máquina de estados. |
| QA12 | Cliente cancela solo en Pendiente o Confirmado | BD e I · cancelación y cupos. |
| QA13 | Reducción de capacidad por debajo de las reservas | BD · calendario y franjas. |
| QA14 | Cobro/factura en caja y verificación antes de Entregado | I · doble confirmación simulada. Pendiente verificación en caja real. |
| QA15 | Teclado, lector, zoom y móvil, incluido registro, código y avisos | N e I · teclado, semántica y reflujo emulado. Pendientes lector interactivo y teléfonos físicos. |
| QA16 | Catálogo extenso, red e imágenes lentas, LCP, INP y CLS | U · paginación. N · imagen demorada y reflujo. Pendientes carga representativa y p75 en un entorno publicado. |
| QA17 | Pedidos cancelados y ventas de prueba diferenciados | BD · cohortes. U e I · analítica e inventario. |
| QA18 | Restauración, permisos y secretos | BD · roles y restauración local. N · ausencia de credenciales en respuesta pública. Pendiente restauración del proveedor. |
| QA19 | Registro incompleto y duplicados concurrentes | U, N, BD e I · alta de clientes. |
| QA20 | Código correcto, incorrecto, usado, vencido o ajeno | I · correo y código de prueba. |
| QA21 | Login, recuperación y ausencia de 2FA | I · sesiones y recuperación. |
| QA22 | Perfil y favoritos limitados al dueño | BD e I · contacto, permisos y favoritos. |
| QA23 | Repetición con stock o precio nuevo sin envío | U e I · repetición e historial. |
| QA24 | Cada cambio de estado se notifica dentro del sitio | BD e I · avisos únicos, lectura, reconexión y comprobación de SMTP. |
| QA25 | Alerta de pedido con audio permitido y bloqueado | I · permiso simulado de audio y alerta visible. |
| QA26 | Motivo obligatorio de cancelación administrativa | BD · cancelación, auditoría y privacidad del motivo. |
| QA27 | Cancelación concurrente con preparación | BD · conflicto de estado y doble cancelación. |
| QA28 | Faltante en pedido enviado obliga a cancelar | BD · preparación y cancelación por faltante. |
| QA29 | Edición editorial sin alterar datos comerciales | BD e I · visibilidad, CMS y banners. Pendiente transferencia con Supabase Storage. |
| QA30 | Ahorro solo con comparador y oferta verificables | U y N · promociones. |
| QA31 | Recomendaciones solo en ficha y pago en caja | N e I · ficha, carrito y revisión sin campo de observaciones. |
| QA32 | Identidad de Portoviejo y marcadores de contenido oficial | N · identidad y no indexación. I · publicación controlada. |

## Cierre de demostración y piloto

- **Demostración**. Ejecutar las suites, revisar las verificaciones pendientes y mantener deshabilitados los pedidos reales. [PROGRESS.md](../PROGRESS.md)
- **Accesibilidad**. Completar una sesión con lector de pantalla en registro, código, pedido, avisos y administración. Repetir los flujos en Android e iOS físicos con teclado y zoom donde aplique.
- **Rendimiento**. Medir en el dominio de piloto y con catálogo representativo. Registrar p75 de LCP ≤ 2,5 s, INP ≤ 200 ms y CLS ≤ 0,1 en móvil y escritorio, período y tamaño de muestra.
- **Integración**. Validar acceso autorizado de solo lectura a Picking, mapeo de identificadores y caducidad. Confirmar en caja el flujo de cobro y retiro antes de habilitar operación real.
- **Contenido y seguridad**. Configurar dominio, correo y Storage, completar galerías, validar contenido institucional y legal, rotar credenciales de prueba y verificar backup/restore del proveedor en un entorno aislado.
- **Entrega**. Los defectos críticos de acceso, datos personales, overbooking, cobro y pedidos duplicados bloquean la aceptación.

### Restauración local

La verificación copia un clúster PostgreSQL detenido a un directorio temporal nuevo, arranca la copia en un puerto distinto y comprueba pedidos, eventos, cupos y RLS. El ejercicio usa datos ficticios. La restauración de Supabase administrado requiere una instancia aislada con su configuración de Auth y Storage y una copia autorizada.
