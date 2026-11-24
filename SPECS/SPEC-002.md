# SPEC-002 — Arquitectura, contratos y datos simulados

**Estado:** Lista para planificación e implementación por Codex con datos de prueba.  
**Dependencias:** SPEC-001.  
**Base documental:** Secc. 4, 8, 15–16; P01–P03, RN12.

## Objetivo
Definir límites de aplicación para poder implementar el negocio sin conocer aún el mecanismo de Picking.

## Alcance funcional y UX
Capas de presentación, servidor, persistencia Supabase y adaptador comercial; contratos de catálogo, variante, precios, descuentos, inventario y ventas; datos ficticios consistentes; errores, vigencia y procedencia.

## Reglas de negocio y límites
Picking sigue siendo fuente futura de datos comerciales; no presumir REST ni acceso directo; modo simulado nunca debe presentarse como datos reales; claves privadas solo en servidor.

## Criterios de aceptación verificables
El catálogo ficticio opera sin conexión real; los módulos distinguen fuente y antigüedad; el adaptador comercial puede sustituirse sin rehacer pantallas; las operaciones reales se bloquean sin validación.

## Escenarios mínimos de prueba
Simular éxito, fallos, datos ausentes, caducidad, promociones vencidas y acceso no autorizado; comprobar ausencia de dependencias comerciales directas en UI.

## Entrega esperada de Codex
Funcionalidad construida conforme al documento maestro, manejo de estados vacíos/error/carga, controles de autorización, pruebas automatizadas apropiadas y evidencia de verificación. Explicar decisiones técnicas, archivos afectados, limitaciones y resultados sin ampliar el alcance.

## Condiciones de finalización
- Cumple los criterios de aceptación de esta spec y no rompe specs anteriores.
- Usa datos simulados inequívocos si depende de Picking aún no integrado.
- Incluye pruebas relevantes de seguridad, accesibilidad y regresión.
- No se considera habilitada la operación comercial real por finalizar esta spec.

## Reglas globales obligatorias
- Comisariato Mi Comercio está en Portoviejo, Manabí; no confundir con la cadena Mi Comisariato de Corporación El Rosado.
- Tecnología elegida: Next.js, TypeScript, Tailwind CSS y Supabase. No introducir Django sin nueva decisión.
- Sin 2FA, pago online, reparto, portal mayorista separado ni cuentas para preparadores.
- Clientes pueden navegar el catálogo y preparar carrito sin registrarse; necesitan cuenta verificada para enviar pedidos.
- Solo administrador autorizado opera el dashboard; los empleados preparan físicamente por instrucción verbal.
- Datos comerciales de catálogo, stock, precios, promociones y ventas proceden de Picking cuando se autorice acceso; web administra contenido editorial, no valores comerciales.
- Horario físico: LV 06:00–18:00, sábado 05:30–18:00, domingo 05:00–14:00. Pedido web: lunes-sábado 07:00–17:00, domingo 07:00–13:00 (límites exactos de borde sujetos a precisión en SDD).
- Retiro solo mismo día, mínimo 30 minutos, franjas de 15 minutos y capacidad por franja configurable.
- Un solo pedido activo; estados Pendiente, Confirmado, En preparación, Listo para retirar, Entregado y Cancelado. Cliente cancela directamente solo Pendiente/Confirmado.
- Pago y facturación únicamente en caja mediante Picking; la web muestra total estimado y conserva instantánea del pedido.
- Notificaciones de pedido al cliente solo dentro de la web. Correo electrónico solo para verificación y recuperación.
- Picking real, dominio/despliegue y contenido institucional oficial se aportarán después de crear el proyecto. Modo prueba completo permitido; pedidos reales bloqueados hasta integración y validación.
