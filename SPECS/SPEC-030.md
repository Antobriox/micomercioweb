# SPEC-030 — Configuración administrativa y excepciones

**Estado:** Lista para planificación e implementación por Codex con datos de prueba.  
**Dependencias:** SPEC-018, SPEC-019, SPEC-025.  
**Base documental:** Secc. 9, 12; RN04–RN08; decisión de cierres especiales.

## Objetivo
Centralizar reglas de horario, cupos, fechas especiales y suspensión temporal desde dashboard.

## Alcance funcional y UX
Editor calendario, apertura/cierre por día, ventana de órdenes, límites de cupos, bloqueo manual de nuevos pedidos/franjas, reactivación, aviso público y registro de cambios.

## Reglas de negocio y límites
Pausar no oculta catálogo ni pedidos existentes; no reducir cupo bajo ocupación ya aceptada; días especiales prevalecen sobre horario semanal de forma explícita.

## Criterios de aceptación verificables
Admin cambia configuración sin código; pedidos fuera de ventana fallan en servidor; pausa se comunica al cliente; cambios auditados.

## Escenarios mínimos de prueba
Feriado, cierre anticipado, reactivación, pedidos en curso, conflicto con ocupación.

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
