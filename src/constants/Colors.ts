// Paleta pastel de Maply Services — misma paleta que tailwind.config.js
// (celeste/azul/violeta/lila validada contra los colores reales del logo).
// Se usa acá para lugares donde hace falta el valor hexadecimal directo
// (ej. StyleSheet.create, librerías nativas como @rnmapbox/maps que no leen clases NativeWind).

export const Colors = {
  celeste: '#AEE1F9',
  azul: '#8EC5FC',
  violeta: '#B39DDB',
  lila: '#D9C6F2',
  background: '#F7F8FC',
  ink: '#1B1F2E',
  muted: '#5B6478',
  cardBorder: '#E3E7F1',
  // Categorías de reporte (pastel), una por cada valor real del ENUM
  // categoria_reporte en la tabla `reporte` de la base de datos.
  categoria: {
    mucha_fila: '#F6A6A6',
    lugar_lleno: '#F9D28C',
    cerrado: '#C9C9C9',
    demora: '#F7B98C',
    atencion_rapida: '#A6E3B8',
    poco_movimiento: '#AEE1F9',
    cambio_recorrido: '#D9C6F2',
    otro: '#B8BFCF',
  },
};

export default Colors;
