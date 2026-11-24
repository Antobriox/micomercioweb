# SPEC-018 — Horarios y calendario operativo

**Estado:** Lista para planificación e implementación por Codex con datos de prueba.  
**Dependencias:** SPEC-005.  
**Base documental:** Secc. 9, 12; RN04–RN06, QA04–QA05.

## Objetivo
Aplicar horarios aprobados y permitir excepciones sin editar código.

## Alcance funcional y UX
Horario físico LV 06–18, S 05:30–18, D 05–14; recepción online LS 07–17, D 07–13; editor administrativo de horarios, feriados, cierre manual y avisos.

## Reglas de negocio y límites
Catálogo disponible 24/7; nuevos pedidos bloqueados fuera de ventana y durante pausa; hora confiable America/Guayaquil del servidor; no asignar siguiente día.

## Criterios de aceptación verificables
Antes de apertura y tras cierre no se envían pedidos; administrador cambia excepciones; cliente ve motivo/disponibilidad; pedidos existentes siguen consultables.

## Escenarios mínimos de prueba
Fronteras 06:59, 07:00, 16:59, 17:00, domingo 12:59/13:00; feriados, pausa/reactivación y zona horaria.

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
