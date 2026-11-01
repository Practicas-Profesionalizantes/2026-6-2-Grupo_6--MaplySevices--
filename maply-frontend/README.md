# Maply Services — App móvil (React Native + Expo)

App para consultar y reportar en tiempo real el estado de lugares cercanos (filas, demoras, cierres) sobre un mapa.

## Tecnologías

- **Expo + Expo Router + TypeScript**: pantallas en `src/app/`.
- **NativeWind** (Tailwind para React Native) con tokens de color de marca en `src/constants/Colors.ts`, modo claro y oscuro con contraste WCAG AA.
- **Mapbox** (`@rnmapbox/maps`) detrás de `src/components/MapaMaply.tsx`: ninguna pantalla usa Mapbox directo.
- **i18n** español / inglés (`src/locales/`), según el idioma del celular.
- **`src/services/api.ts`**: toda la conexión con la API REST del backend.

## Cómo correrlo

1. Copiar `.env.example` a `.env` y completar `EXPO_PUBLIC_API_URL` (URL del backend) y `EXPO_PUBLIC_MAPBOX_TOKEN` (mapbox.com → Access tokens).
2. `npm install`
3. `npx expo start`

El mapa de Mapbox no funciona en Expo Go: para verlo hace falta un development build o el APK.

## Generar el APK (Android)

```
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

El perfil `preview` de `eas.json` genera un APK instalable directo. Las variables `EXPO_PUBLIC_*` hay que cargarlas también en expo.dev → Project → Environment variables. Más detalle en el **Manual de Deploy - Maply Services**.

## Accesibilidad

- Todos los botones tienen rol y etiqueta para TalkBack; los íconos decorativos se ocultan del lector.
- El texto respeta el tamaño de fuente del sistema (los contenedores usan alto mínimo, no fijo).
- Cada pantalla que carga datos tiene estado de carga, vacío y de error con "Reintentar".
