# Sistema de diseño

Implementación de [SPEC-003](../SPECS/SPEC-003.md). El [Documento Maestro v1.1](Comisariato%20Mi%20Comercio%20Web.pdf), sección 14, define los principios de identidad.

| Token | Uso |
| --- | --- |
| Marca #233C7C | Acción principal, enlaces subrayados y foco sobre superficies claras |
| Acento #CD0E11 | Acciones de peligro y errores con mensaje explícito |
| Superficie blanca y lienzo #F6F7FB | Planos de lectura y agrupación |
| Texto #182238 y secundario #48556C | Jerarquía de contenido |
| Manrope e Inter | Títulos y lectura/controles, respectivamente |
| Lucide | Iconos acompañados de texto o de un nombre accesible |
| Movimiento 200 ms | Transición de tono. Instantánea con movimiento reducido |

## Componentes

- Botones primario, secundario y de peligro, con objetivo mínimo de 44 px, estados de espera y deshabilitado. Los enlaces están subrayados y conservan semántica de navegación.
- Campos con etiqueta persistente, descripción de ayuda y error enlazados; el error se comunica mediante texto y estado semántico.
- Tarjeta y avisos informativos, de éxito, advertencia y error. Los avisos dinámicos pueden anunciarse al actualizarse.
- Carga y vacío conservan una estructura estable y expresan el estado mediante texto.
- Diálogo nativo con nombre, cierre con Escape y retorno de foco al control inicial.

La galería `/diagnostico/componentes` muestra los estados con datos de prueba. La distribución es de una columna en móvil y dos en pantallas con espacio suficiente. Las fuentes variables locales se sirven mediante Fontsource y se distribuyen con la licencia SIL Open Font License.
