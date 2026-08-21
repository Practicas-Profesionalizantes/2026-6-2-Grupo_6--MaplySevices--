import { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text } from 'react-native';
import Mapbox from '@rnmapbox/maps';

/**
 * Capa de abstracción sobre el proveedor de mapas.
 *
 * Ninguna pantalla debería importar `@rnmapbox/maps` directamente: todas
 * pasan por acá. Si el día de mañana cambian de Mapbox a Google Maps (o a
 * cualquier otro proveedor), esto es lo único que hay que reescribir —
 * las pantallas que usan <MapaMaply /> y su ref no deberían tocarse.
 *
 * Métodos expuestos por ref (según lo charlado en el chat de Claude):
 *   - mostrarPin(lugar)
 *   - buscarLugar(texto)
 *   - centrarEn(lat, lng)
 */

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (MAPBOX_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
}

export type LugarPin = {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  categoria?: string;
};

export type MapaMaplyHandle = {
  mostrarPin: (lugar: LugarPin) => void;
  buscarLugar: (texto: string) => Promise<void>;
  centrarEn: (lat: number, lng: number) => void;
};

type Props = {
  pines?: LugarPin[];
  onPinPress?: (lugar: LugarPin) => void;
};

export const MapaMaply = forwardRef<MapaMaplyHandle, Props>(function MapaMaply(
  { pines = [], onPinPress },
  ref
) {
  const cameraRef = useRef<Mapbox.Camera>(null);

  useImperativeHandle(ref, () => ({
    mostrarPin(lugar) {
      cameraRef.current?.setCamera({ centerCoordinate: [lugar.longitud, lugar.latitud], zoomLevel: 15 });
    },
    async buscarLugar(_texto: string) {
      // TODO: integrar Mapbox Search Box (con debounce — ver
      // "Implementar debounce en el buscador de lugares" en el backlog).
    },
    centrarEn(lat, lng) {
      cameraRef.current?.setCamera({ centerCoordinate: [lng, lat], zoomLevel: 14 });
    },
  }));

  if (!MAPBOX_TOKEN) {
    // Sin token configurado (.env todavía sin EXPO_PUBLIC_MAPBOX_TOKEN):
    // no rompemos la pantalla, mostramos un placeholder explícito.
    return (
      <View className="h-56 items-center justify-center rounded-2xl bg-maply-lila/40">
        <Text className="text-maply-ink">Mapa (falta configurar EXPO_PUBLIC_MAPBOX_TOKEN en .env)</Text>
      </View>
    );
  }

  return (
    <Mapbox.MapView style={{ height: 220, borderRadius: 16, overflow: 'hidden' }}>
      <Mapbox.Camera ref={cameraRef} zoomLevel={12} centerCoordinate={[-58.3816, -34.6037]} />
      <Mapbox.ShapeSource
        id="reportesSource"
        cluster
        clusterRadius={40}
        shape={{
          type: 'FeatureCollection',
          features: pines.map((lugar) => ({
            type: 'Feature',
            id: String(lugar.id),
            geometry: { type: 'Point', coordinates: [lugar.longitud, lugar.latitud] },
            properties: { ...lugar },
          })),
        }}
        onPress={(e) => {
          const feature = e.features?.[0];
          if (feature?.properties && onPinPress) onPinPress(feature.properties as LugarPin);
        }}
      >
        <Mapbox.CircleLayer
          id="clusterCirculos"
          filter={['has', 'point_count']}
          style={{ circleRadius: 18, circleColor: '#8EC5FC', circleOpacity: 0.85 }}
        />
        <Mapbox.SymbolLayer
          id="clusterConteo"
          filter={['has', 'point_count']}
          style={{ textField: ['get', 'point_count'], textSize: 12, textColor: '#1B1F2E' }}
        />
        <Mapbox.CircleLayer
          id="pinesIndividuales"
          filter={['!', ['has', 'point_count']]}
          style={{ circleRadius: 7, circleColor: '#B39DDB' }}
        />
      </Mapbox.ShapeSource>
    </Mapbox.MapView>
  );
});

export default MapaMaply;
