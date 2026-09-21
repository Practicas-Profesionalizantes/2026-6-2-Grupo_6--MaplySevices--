// Captura la ubicación GPS real del dispositivo/navegador del usuario
// (SCRUM-134). Pide permiso una sola vez al montar; si lo niega o no hay
// GPS disponible, no rompe nada — simplemente `ubicacion` queda en null y
// el resto de la app sigue usando el centro por defecto (CABA).
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type Ubicacion = { latitud: number; longitud: number };

export function useUbicacionActual() {
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (activo) {
            setPermisoDenegado(true);
            setCargando(false);
          }
          return;
        }
        const posicion = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (activo) {
          setUbicacion({
            latitud: posicion.coords.latitude,
            longitud: posicion.coords.longitude,
          });
        }
      } catch {
        // Sin GPS, sin conexión, o permiso revocado después de pedirlo:
        // se ignora y se sigue con el centro por defecto del mapa.
      } finally {
        if (activo) setCargando(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, []);

  return { ubicacion, permisoDenegado, cargando };
}
