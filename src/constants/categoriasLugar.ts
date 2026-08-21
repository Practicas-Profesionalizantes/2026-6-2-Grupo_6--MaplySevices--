// Categorías reales de la tabla `lugar` (tipo de establecimiento). No
// confundir con `categoriasReporte.ts`, que es la situación que se reporta
// en un lugar (mucha fila, cerrado, etc.) — son dos ENUMs distintos.
export const CATEGORIAS_LUGAR = [
  'hospital',
  'banco',
  'restaurante',
  'transporte',
  'comercio',
  'oficina_publica',
  'otro',
] as const;

export type CategoriaLugar = (typeof CATEGORIAS_LUGAR)[number];
