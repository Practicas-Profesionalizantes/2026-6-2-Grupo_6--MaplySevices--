// Puente mínimo para devolver el lugar elegido en select-lugar.tsx a la
// pantalla de create-report.tsx, sin sumar una librería de estado global
// solo para esto: se guarda un callback pendiente y se resuelve cuando la
// persona toca un lugar en la lista.
import type { Lugar } from '@/services/api';

let callbackPendiente: ((lugar: Lugar) => void) | null = null;

export function pedirSeleccionDeLugar(callback: (lugar: Lugar) => void) {
  callbackPendiente = callback;
}

export function resolverSeleccionDeLugar(lugar: Lugar) {
  if (callbackPendiente) {
    callbackPendiente(lugar);
    callbackPendiente = null;
  }
}
