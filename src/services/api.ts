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
// Se guarda en el dispositivo con AsyncStorage para que la sesión
// sobreviva a cerrar y reabrir la app. No es el lugar más "seguro"
// posible (para eso existe expo-secure-store), pero para el alcance de
// este proyecto alcanza y de paso funciona igual en web y en nativo.
const TOKEN_KEY = "maply_token";
const USUARIO_KEY = "maply_usuario";

export type Usuario = {
  id_usuario: number;
  nombre: string;
  email: string;
};

async function guardarSesion(token: string, usuario: Usuario): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USUARIO_KEY, JSON.stringify(usuario)],
  ]);
}

async function borrarSesion(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USUARIO_KEY]);
}

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getUsuarioActual(): Promise<Usuario | null> {
  const raw = await AsyncStorage.getItem(USUARIO_KEY);
  return raw ? (JSON.parse(raw) as Usuario) : null;
}

export type Reporte = {
  id_reporte: number;
  id_lugar: number;
  contenido: string;
  categoria_reporte: string;
  fecha_registro: string;
  lugar?: { nombre: string; latitud?: string | null; longitud?: string | null };
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

export function getReporteDetalle(id: string | number): Promise<Reporte> {
  return request<Reporte>(`/reportes/${id}`);
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

export function getLugares(categoria?: string): Promise<Lugar[]> {
  const query = categoria ? `?categoria=${encodeURIComponent(categoria)}` : "";
  return request<Lugar[]>(`/lugares${query}`);
}
