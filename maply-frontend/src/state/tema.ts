// Preferencia de tema elegida en Configuración: automático (sigue al
// celular), claro u oscuro. Se guarda en el dispositivo y se aplica al abrir.
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PreferenciaTema = 'auto' | 'claro' | 'oscuro';

const CLAVE = 'maply.tema';
let actual: PreferenciaTema = 'auto';
const oyentes = new Set<() => void>();

function avisar() {
  oyentes.forEach((oyente) => oyente());
}

export function cambiarTema(preferencia: PreferenciaTema) {
  actual = preferencia;
  avisar();
  AsyncStorage.setItem(CLAVE, preferencia).catch(() => {});
}

// Se llama una vez al arrancar la app (_layout.tsx).
export async function cargarTemaGuardado() {
  try {
    const guardado = await AsyncStorage.getItem(CLAVE);
    if (guardado === 'claro' || guardado === 'oscuro' || guardado === 'auto') {
      actual = guardado;
      avisar();
    }
  } catch {
    // Sin almacenamiento disponible: queda en automático.
  }
}

export function usePreferenciaTema(): PreferenciaTema {
  return useSyncExternalStore(
    (oyente) => {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
    () => actual,
    () => actual
  );
}
