// Tokens de color de Maply. Única fuente: _layout.tsx los pasa a NativeWind
// como variables CSS (clases bg-fondo, text-texto, etc.) y lo que necesita el
// hex directo (íconos, Mapbox, ActivityIndicator) usa useColores().
import { useColorScheme } from 'react-native';

export const Marca = { azul: '#3D98F5', indigo: '#3E50E3', violeta: '#7051ED' };

export const Temas = {
  light: {
    fondo: '#F4F6FB',
    superficie: '#FFFFFF',
    tarjeta: '#FFFFFF',
    texto: '#0E1330',
    secundario: '#5A6480',
    borde: '#E6EAF3',
    boton: '#3E50E3',
    peligro: '#C0263A',
  },
  dark: {
    fondo: '#0A0E1F',
    superficie: '#151A33',
    tarjeta: '#1A2040',
    texto: '#EEF1FA',
    secundario: '#9AA3C0',
    borde: '#252B4A',
    boton: '#5B6BFF',
    peligro: '#FF6B7A',
  },
};

// Un color por cada valor real del ENUM categoria_reporte.
export const ColoresEstado: Record<string, string> = {
  mucha_fila: '#E5484D',
  lugar_lleno: '#EAB308',
  cerrado: '#6B7280',
  demora: '#F97316',
  atencion_rapida: '#16A34A',
  poco_movimiento: '#0EA5E9',
  cambio_recorrido: '#8B5CF6',
  otro: '#94A3B8',
};

export const colorEstado = (categoria?: string | null) => ColoresEstado[categoria ?? ''] ?? ColoresEstado.otro;

// Fondo del ícono: el mismo color al ~15 %.
export const fondoEstado = (categoria?: string | null) => colorEstado(categoria) + '26';

// Texto del estado: el color puro no contrasta sobre blanco (amarillo, celeste),
// así que en claro se oscurece y en oscuro se aclara.
export function textoEstado(categoria: string | null | undefined, oscuro: boolean) {
  const hex = colorEstado(categoria);
  const destino = oscuro ? 255 : 0;
  const t = oscuro ? 0.3 : 0.4;
  const canal = (i: number) =>
    Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - t) + destino * t)
      .toString(16)
      .padStart(2, '0');
  return `#${canal(1)}${canal(3)}${canal(5)}`;
}

export function useColores() {
  const oscuro = useColorScheme() === 'dark';
  return { ...Temas[oscuro ? 'dark' : 'light'], oscuro };
}
