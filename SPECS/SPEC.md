# Comisariato Mi Comercio Web — 34 especificaciones SDD

Documento de trabajo para Codex · 22 de octubre de 2026

Base: Documento maestro v1.1 corregido (24 páginas). No contiene código.

Las especificaciones describen QUÉ debe construirse y CÓMO aceptarlo; las decisiones técnicas menores se dejan a Codex.

## Índice y dependencias

- **SPEC-001** — Inicialización y entornos · Depende de: Ninguna
- **SPEC-002** — Arquitectura, contratos y datos simulados · Depende de: SPEC-001
- **SPEC-003** — Sistema de diseño y componentes UI · Depende de: SPEC-001
- **SPEC-004** — Sitemap, layouts y navegación · Depende de: SPEC-001, SPEC-003
- **SPEC-005** — Modelo web, seguridad de acceso y auditoría · Depende de: SPEC-001, SPEC-002
- **SPEC-006** — Registro de clientes y validación · Depende de: SPEC-005, SPEC-003
- **SPEC-007** — Verificación de correo con código · Depende de: SPEC-006
- **SPEC-008** — Login, sesiones y recuperación · Depende de: SPEC-005, SPEC-007
- **SPEC-009** — Mi perfil y seguridad de cuenta · Depende de: SPEC-008, SPEC-005
- **SPEC-010** — Favoritos y repetición de compras · Depende de: SPEC-008, SPEC-012
- **SPEC-011** — Catálogo, categorías y fichas · Depende de: SPEC-002, SPEC-003, SPEC-004
- **SPEC-012** — Variantes y presentaciones · Depende de: SPEC-002, SPEC-011
- **SPEC-013** — Búsqueda, filtros y ordenamiento · Depende de: SPEC-004, SPEC-011
- **SPEC-014** — Promociones y precios de oferta · Depende de: SPEC-002, SPEC-011
- **SPEC-015** — Recomendaciones en ficha de producto · Depende de: SPEC-011, SPEC-012
- **SPEC-016** — Carrito persistente de visitante y cliente · Depende de: SPEC-005, SPEC-011, SPEC-012
- **SPEC-017** — Resumen final y revisión de precios · Depende de: SPEC-016, SPEC-008, SPEC-002
- **SPEC-018** — Horarios y calendario operativo · Depende de: SPEC-005
- **SPEC-019** — Franjas de retiro y cupos · Depende de: SPEC-018, SPEC-005
- **SPEC-020** — Creación de pedidos e idempotencia · Depende de: SPEC-005, SPEC-008, SPEC-016, SPEC-017, SPEC-018, SPEC-019
- **SPEC-021** — Seguimiento e historial de pedidos · Depende de: SPEC-008, SPEC-020
- **SPEC-022** — Cancelaciones de cliente y administrador · Depende de: SPEC-020, SPEC-021
- **SPEC-023** — Máquina de estados y coordinación manual · Depende de: SPEC-020, SPEC-022
- **SPEC-024** — Notificaciones internas del cliente · Depende de: SPEC-005, SPEC-021, SPEC-023
- **SPEC-025** — Dashboard inicial y alertas de nuevos pedidos · Depende de: SPEC-005, SPEC-020, SPEC-023
- **SPEC-026** — Administración de pedidos y clientes · Depende de: SPEC-005, SPEC-020, SPEC-022, SPEC-023
- **SPEC-027** — Catálogo editorial e imágenes · Depende de: SPEC-005, SPEC-011
- **SPEC-028** — Banners y campañas visuales CMS · Depende de: SPEC-005, SPEC-003, SPEC-027
- **SPEC-029** — CMS de páginas, FAQs y SEO editable · Depende de: SPEC-004, SPEC-005, SPEC-003
- **SPEC-030** — Configuración administrativa y excepciones · Depende de: SPEC-018, SPEC-019, SPEC-025
- **SPEC-031** — Analítica de pedidos y ventas Picking · Depende de: SPEC-002, SPEC-025
- **SPEC-032** — Analítica de inventario Picking · Depende de: SPEC-002, SPEC-025
- **SPEC-033** — Adaptador Picking, disponibilidad y modo seguro · Depende de: SPEC-002, SPEC-011, SPEC-014, SPEC-017, SPEC-031, SPEC-032
- **SPEC-034** — Seguridad, accesibilidad, SEO, QA y preparación de entrega · Depende de: SPEC-003, SPEC-004, SPEC-005, SPEC-006, SPEC-008, SPEC-013, SPEC-020, SPEC-023, SPEC-024, SPEC-025, SPEC-026, SPEC-027, SPEC-028, SPEC-029, SPEC-030, SPEC-033

## Forma de ejecución
Implementar una spec por vez; Codex debe comprobar dependencias, ejecutar pruebas y reportar resultados. La spec 033 puede permanecer en adaptador simulado hasta disponer de Picking.
