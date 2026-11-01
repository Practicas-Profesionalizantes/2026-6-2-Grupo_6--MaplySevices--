import { forwardRef, useImperativeHandle } from 'react';
import { View, Text } from 'react-native';
import type { MapaMaplyHandle, MapaMaplyProps } from './MapaMaply';

/**
 * Versión para WEB de la capa de abstracción del mapa.
 *
 * Metro/Expo Router elige este archivo automáticamente cuando se corre
 * "npx expo start" y se aprieta "w" (por la terminación .web.tsx), y usa
 * MapaMaply.tsx (el de Mapbox nativo) en Android/iOS. Es la misma convención
 * que ya usa el propio template de Expo (animated-icon.web.tsx, etc.).
 *
 * Por qué existe: @rnmapbox/maps es un módulo nativo pensado para
 * Android/iOS. Su variante web depende del paquete "mapbox-gl" + su CSS,
 * que Metro no sabe empaquetar sin configuración extra (Webpack, no Metro).
 * Como el foco del proyecto es mobile-first, por ahora en web mostramos
 * este placeholder en vez de pelear con esa configuración — se puede
 * revisar más adelante si de verdad hace falta el mapa completo en la
 * versión de escritorio.
 */
export const MapaMaply = forwardRef<MapaMaplyHandle, MapaMaplyProps>(
  function MapaMaplyWeb({ style }, ref) {
    useImperativeHandle(ref, () => ({
      mostrarPin: () => {},
      buscarLugar: async () => {},
      centrarEn: () => {},
    }));

    return (
      <View className="items-center justify-center bg-borde" style={style}>
        <Text className="font-nunito text-secundario">Vista de mapa disponible en la app móvil (Android/iOS)</Text>
      </View>
    );
  }
);

export default MapaMaply;
