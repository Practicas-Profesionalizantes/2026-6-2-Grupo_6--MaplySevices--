import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { View, Text, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import Mapbox from '@rnmapbox/maps';

import { colorEstado, useColores } from '@/constants/Colors';

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
// La política de privacidad dice que Mapbox solo recibe IP y zona del mapa:
// sin esto el SDK manda telemetría de uso y ubicación a Mapbox.
Mapbox.setTelemetryEnabled(false);

const CENTRO_CABA: [number, number] = [-58.3816, -34.6037];

export type LugarPin = {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  categoria?: string;
  etiqueta?: string; // texto del cartel cuando el pin está elegido ("Lugar · Estado")
};

export type MapaMaplyHandle = {
  mostrarPin: (lugar: LugarPin) => void;
  buscarLugar: (texto: string) => Promise<void>;
  centrarEn: (lat: number, lng: number) => void;
};

export type MapaMaplyProps = {
  pines?: LugarPin[];
  onPinPress?: (lugar: LugarPin) => void;
  elegidoId?: number | null;
  centro?: [number, number]; // [lng, lat]
  zoom?: number;
  interactivo?: boolean;
  mostrarUbicacion?: boolean;
  margenOrnamentos?: number; // distancia desde arriba para el logo de Mapbox (abajo lo tapa la hoja)
  style?: StyleProp<ViewStyle>;
};

// Pin en gota: un cuadrado con una esquina en punta girado 45°.
function Pin({ lugar, elegido, orden, onPress }: { lugar: LugarPin; elegido: boolean; orden: number; onPress?: () => void }) {
  const c = useColores();
  const lado = elegido ? 44 : 34;
  const caida = useSharedValue(-24);
  const opacidad = useSharedValue(0);

  // Caen escalonados, 40 ms entre uno y otro. Con "reducir movimiento"
  // Reanimated salta directo al valor final.
  useEffect(() => {
    caida.value = withDelay(orden * 40, withSpring(0, { damping: 12, stiffness: 180 }));
    opacidad.value = withDelay(orden * 40, withTiming(1, { duration: 150 }));
  }, [caida, opacidad, orden]);

  const animado = useAnimatedStyle(() => ({ opacity: opacidad.value, transform: [{ translateY: caida.value }] }));

  return (
    <Animated.View style={[{ alignItems: 'center' }, animado]}>
      {elegido && lugar.etiqueta ? (
        <View
          className="mb-1 rounded-xl px-3 py-1.5"
          style={{ backgroundColor: c.oscuro ? '#EEF1FA' : '#0E1330', maxWidth: 230 }}
        >
          <Text className="font-nunito8 text-[13px]" style={{ color: c.oscuro ? '#0E1330' : '#FFFFFF' }} numberOfLines={1}>
            {lugar.etiqueta}
          </Text>
        </View>
      ) : null}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={lugar.etiqueta ?? lugar.nombre}
        hitSlop={6}
        style={{ width: lado * 1.42, height: lado * 1.42, alignItems: 'center', justifyContent: 'center' }}
      >
        <View
          style={{
            width: lado,
            height: lado,
            borderRadius: lado / 2,
            borderBottomRightRadius: 2,
            transform: [{ rotate: '45deg' }],
            backgroundColor: colorEstado(lugar.categoria),
            borderWidth: 3,
            borderColor: c.oscuro ? '#0A0E1F' : '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: lado * 0.34,
              height: lado * 0.34,
              borderRadius: lado,
              backgroundColor: c.oscuro ? '#0A0E1F' : '#FFFFFF',
            }}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export const MapaMaply = forwardRef<MapaMaplyHandle, MapaMaplyProps>(function MapaMaply(
  { pines = [], onPinPress, elegidoId, centro, zoom = 12, interactivo = true, mostrarUbicacion, margenOrnamentos = 8, style },
  ref
) {
  const cameraRef = useRef<Mapbox.Camera>(null);
  const { oscuro } = useColores();

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
      <View className="items-center justify-center bg-borde" style={style}>
        <Text className="font-nunito text-secundario">Mapa (falta configurar EXPO_PUBLIC_MAPBOX_TOKEN en .env)</Text>
      </View>
    );
  }

  return (
    <Mapbox.MapView
      style={style}
      styleURL={oscuro ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Light}
      scrollEnabled={interactivo}
      zoomEnabled={interactivo}
      rotateEnabled={interactivo}
      pitchEnabled={false}
      scaleBarEnabled={false}
      logoPosition={{ top: margenOrnamentos, left: 12 }}
      attributionPosition={{ top: margenOrnamentos, left: 100 }}
      compassEnabled={false}
    >
      <Mapbox.Camera ref={cameraRef} zoomLevel={zoom} centerCoordinate={centro ?? CENTRO_CABA} animationDuration={0} />
      {mostrarUbicacion ? <Mapbox.LocationPuck puckBearingEnabled={false} /> : null}
      {/* ponytail: un MarkerView por lugar (sin clusters) para poder animar
          los pines; si algún día hay cientos de lugares en pantalla, volver
          a ShapeSource + SymbolLayer con clusters. */}
      {pines.map((lugar, i) => (
        <Mapbox.MarkerView
          key={lugar.id}
          coordinate={[lugar.longitud, lugar.latitud]}
          anchor={{ x: 0.5, y: 1 }}
          allowOverlap
        >
          <Pin
            lugar={lugar}
            orden={i}
            elegido={lugar.id === elegidoId}
            onPress={onPinPress ? () => onPinPress(lugar) : undefined}
          />
        </Mapbox.MarkerView>
      ))}
    </Mapbox.MapView>
  );
});

export default MapaMaply;
