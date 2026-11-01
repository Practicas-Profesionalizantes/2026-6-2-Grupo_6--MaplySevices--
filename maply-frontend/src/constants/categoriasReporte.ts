// Valores REALES del ENUM `categoria_reporte` de la tabla `reporte`
// (confirmado con DESCRIBE reporte contra la base real). No es "tipo de
// lugar" (eso no existe como columna todavía) — es "qué está pasando" en
// el lugar. Cualquier pantalla que muestre o pida esta categoría debería
// importar esto en vez de inventar su propia lista, para que no se
// vuelvan a desincronizar como pasó acá.

export const CATEGORIAS_REPORTE = [
  'mucha_fila',
  'lugar_lleno',
  'cerrado',
  'demora',
  'atencion_rapida',
  'poco_movimiento',
  'cambio_recorrido',
  'otro',
] as const;

export type CategoriaReporte = (typeof CATEGORIAS_REPORTE)[number];
