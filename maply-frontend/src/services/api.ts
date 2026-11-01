// Conexión al backend real (Node + Express + MySQL, armado por Felipe).
// Todo pasa por acá para no tener fetch() sueltos por las pantallas:
// si el día de mañana cambia la URL o hace falta mandar el JWT en headers,
// se toca un solo lugar.
//
// Ojo con "localhost" en el emulador de Android: el emulador corre en su
// propia red virtual, así que "localhost" ahí adentro apunta al propio
// emulador, no a la PC donde corre el backend. El alias que sí llega a la
// PC anfitriona es 10.0.2.2. En web (navegador) y iOS, "localhost" sí
// funciona normal. Para no tener que editar el .env cada vez que se
// cambia de plataforma, esto lo resuelve solo según dónde esté corriendo.
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

function resolveApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const base = envUrl ?? "http://localhost:3000/api";
  if (Platform.OS === "android" && base.includes("localhost")) {
    return base.replace("localhost", "10.0.2.2");
  }
  return base;
}

const API_URL = resolveApiUrl();

// --- Sesión (token JWT + datos del usuario logueado) -----------------
// En el celular va al almacenamiento cifrado del sistema (Keychain en iOS,
// Keystore en Android) con expo-secure-store. En web no existe, así que ahí
// se usa AsyncStorage (localStorage).
const TOKEN_KEY = "maply_token";
const USUARIO_KEY = "maply_usuario";

const almacen = {
  get: (k: string) => (Platform.OS === "web" ? AsyncStorage.getItem(k) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (Platform.OS === "web" ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v)),
  del: (k: string) => (Platform.OS === "web" ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k)),
};

export type Usuario = {
  id_usuario: number;
  nombre: string;
  email: string;
  // "Miembro desde" (pantalla de Configuración, SCRUM-271). Puede no venir
  // en sesiones viejas guardadas en el dispositivo antes de este cambio.
  fecha_registro?: string;
};

async function guardarSesion(token: string, usuario: Usuario): Promise<void> {
  await almacen.set(TOKEN_KEY, token);
  await almacen.set(USUARIO_KEY, JSON.stringify(usuario));
}

async function borrarSesion(): Promise<void> {
  await almacen.del(TOKEN_KEY);
  await almacen.del(USUARIO_KEY);
}

async function getToken(): Promise<string | null> {
  return almacen.get(TOKEN_KEY);
}

export async function getUsuarioActual(): Promise<Usuario | null> {
  const raw = await almacen.get(USUARIO_KEY);
  return raw ? (JSON.parse(raw) as Usuario) : null;
}

// Pantalla de bienvenida: se muestra solo la primera vez (no es dato sensible).
const BIENVENIDA_KEY = "maply_bienvenida_vista";
export const bienvenidaVista = () => AsyncStorage.getItem(BIENVENIDA_KEY).then(Boolean, () => true);
export const marcarBienvenidaVista = () => AsyncStorage.setItem(BIENVENIDA_KEY, "1");

export type Reporte = {
  id_reporte: number;
  id_lugar: number;
  contenido: string;
  categoria_reporte: string;
  fecha_registro: string;
  lugar?: { nombre: string; categoria?: string; latitud?: string | null; longitud?: string | null };
};

export type EstadoActualLugar = {
  id_lugar: number;
  estado: string | null;
  total_reportes: number;
  desglose?: { categoria_reporte: string; total: number }[];
  mensaje?: string;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  });
  // Token vencido, revocado o cuenta bloqueada: se limpia la sesión local
  // para que la app no siga mostrando a la persona como logueada.
  if (res.status === 401 && token) await borrarSesion();
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let mensaje = body || res.statusText;
    try {
      const parsed = JSON.parse(body);
      if (parsed?.error) mensaje = parsed.error;
    } catch {
      // el body no era JSON (ej: error 500 sin manejar) — se usa tal cual.
    }
    throw new Error(mensaje);
  }
  // 204 / respuestas sin body (no debería pasar hoy, pero por las dudas)
  const texto = await res.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}

// --- Auth --------------------------------------------------------------

export async function register(data: {
  nombre: string;
  email: string;
  contrasena: string;
  telefono?: string;
  acepta_terminos: boolean;
}): Promise<{ id_usuario: number; nombre: string; email: string }> {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(data: { email: string; contrasena: string }): Promise<Usuario> {
  const respuesta = await request<{ token: string; usuario: Usuario }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  await guardarSesion(respuesta.token, respuesta.usuario);
  return respuesta.usuario;
}

export async function logout(): Promise<void> {
  try {
    await request("/auth/logout", { method: "POST" });
  } catch {
    // Si el server no respondió (sin conexión, etc.) igual limpiamos la
    // sesión local: no tiene sentido dejar a la persona con una sesión
    // "colgada" en el dispositivo solo porque el logout remoto falló.
  } finally {
    await borrarSesion();
  }
}

// Olvidé mi contraseña: pide un código por mail y después lo canjea.
export function olvideContrasena(email: string): Promise<{ mensaje: string }> {
  return request("/auth/olvide-contrasena", { method: "POST", body: JSON.stringify({ email }) });
}

export function restablecerContrasena(data: { email: string; codigo: string; contrasena: string }): Promise<{ mensaje: string }> {
  return request("/auth/restablecer-contrasena", { method: "POST", body: JSON.stringify(data) });
}

// Borra la cuenta y todos sus datos en el servidor. Pide la contraseña de nuevo.
export async function borrarCuenta(contrasena: string): Promise<void> {
  await request("/auth/cuenta", { method: "DELETE", body: JSON.stringify({ contrasena }) });
  await borrarSesion();
}

export function getReportes(): Promise<Reporte[]> {
  return request<Reporte[]>("/reportes");
}

export function crearReporte(data: {
  id_lugar: number;
  contenido: string;
  categoria_reporte: string;
}): Promise<Reporte> {
  return request<Reporte>("/reportes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function denunciarReporte(id: string | number, motivo: string): Promise<{ mensaje: string }> {
  return request(`/reportes/${id}/denuncias`, { method: "POST", body: JSON.stringify({ motivo }) });
}

export function getReporteDetalle(id: string | number): Promise<Reporte> {
  return request<Reporte>(`/reportes/${id}`);
}

export function traducirReporte(id: string | number, idioma: string): Promise<{ texto: string }> {
  return request(`/reportes/${id}/traduccion?idioma=${idioma}`);
}

export function getEstadoActualLugar(idLugar: number | string): Promise<EstadoActualLugar> {
  return request<EstadoActualLugar>(`/reportes/lugar/${idLugar}/estado-actual`);
}

// --- Lugares -------------------------------------------------------------

export type Lugar = {
  id_lugar: number;
  nombre: string;
  categoria: string;
  latitud: string | null;
  longitud: string | null;
  direccion: string | null;
};

export function getLugares(categoria?: string, q?: string): Promise<Lugar[]> {
  const params = new URLSearchParams();
  if (categoria) params.set("categoria", categoria);
  if (q) params.set("q", q);
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<Lugar[]>(`/lugares${query}`);
}

export function crearLugar(data: {
  nombre: string;
  categoria: string;
  latitud?: number;
  longitud?: number;
  direccion?: string;
}): Promise<Lugar> {
  return request<Lugar>("/lugares", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
