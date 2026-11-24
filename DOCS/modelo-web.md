# Modelo web y permisos

Implementación de [SPEC-005](../SPECS/SPEC-005.md), Documento Maestro §§ 7, 10, 12, 15–16. El proyecto Supabase de demostración utiliza una base independiente y queda reservado a datos sintéticos. El adaptador comercial conserva la propiedad de catálogo, precios, existencias, promociones y ventas.

| Actor | Alcance inicial |
| --- | --- |
| Visitante | Catálogo simulado a través de Next.js |
| Cliente activo y verificado | Perfil, carrito, favoritos, pedidos y avisos de su propia cuenta |
| Administrador autorizado | Lectura de operación y auditoría, concedida por una asignación revocable |
| Servicio de base | Migraciones y funciones específicas de persistencia |

Las políticas RLS protegen todas las tablas. Las mutaciones de pedidos, perfiles, administración y auditoría se concederán mediante operaciones acotadas de sus SPECS. Los SKU comerciales se referencian por identificador y las líneas aceptadas conservan una instantánea. PostgreSQL impone unicidad de identificación y correo, pedido activo único y ocupación transaccional de la franja. La bitácora guarda actor, entidad, operación y fecha, con acceso sujeto a autorización.

## Verificación local

`npm run test:db` levanta PostgreSQL 17 temporal, crea identidades ficticias y aplica las mismas migraciones SQL. Se usan conexiones separadas para comprobar integridad concurrente. El esquema de autenticación de la prueba representa el contrato `auth.uid()` y queda fuera de las migraciones.

Para probar interoperabilidad del proveedor en un entorno de desarrollo con Docker, instala la CLI oficial de Supabase y ejecuta `supabase start` con `supabase/config.toml`. Configura únicamente la URL y la clave publicable del entorno local o de una instancia independiente de demostración.

`npm run test:auth` ejecuta pruebas de integración después de `npm run build`. El entorno de pruebas inicia PostgreSQL temporal, Supabase Auth y PostgREST, un receptor SMTP local y Next.js. Define `MICOMERCIO_TEST_AUTH_BINARY` y `MICOMERCIO_TEST_REST_BINARY` con las rutas a los binarios de prueba. En Windows, PostgREST necesita las DLL de PostgreSQL en el PATH del proceso. Sin los binarios, la suite informa los casos omitidos.

La cédula se valida como texto mediante formato y dígito de control. Este control no consulta un registro de identidad. El alta crea un perfil pendiente y solo conserva los campos de identificación en la tabla protegida de perfiles.
