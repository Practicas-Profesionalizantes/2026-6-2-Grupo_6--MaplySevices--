# Maply Services — Frontend (armado de cero)

Este proyecto reemplaza al frontend anterior (el que estaba en `maply-services-app.rar`,
hecho con ayuda de otra IA). Se generó con `create-expo-app` oficial y a partir de ahí
se le sumaron, a mano, las piezas que ya habíamos definido en el chat de Claude.

## Qué tiene

- **Expo Router + TypeScript**, rutas en `src/app/`: `index.tsx` (home con reportes),
  `create-report.tsx` (nuevo reporte), `report-details.tsx` (detalle).
- **NativeWind (Tailwind para React Native)**, con la paleta pastel de marca ya
  cargada por nombre en `tailwind.config.js` y en `src/constants/Colors.ts`
  (`maply-celeste`, `maply-azul`, `maply-violeta`, `maply-lila`).
- **`src/components/MapaMaply.tsx`**: la capa de abstracción sobre el mapa. Ninguna
  pantalla debería importar `@rnmapbox/maps` directamente — todas pasan por acá
  (`mostrarPin`, `buscarLugar`, `centrarEn`), para que cambiar de proveedor de mapa
  el día de mañana sea editar un solo archivo.
- **i18n** (`i18next` + `react-i18next` + `expo-localization`) con `src/locales/es.json`
  y `src/locales/en.json`, detectando el idioma del dispositivo por default.
- **`src/services/api.ts`**: toda la conexión al backend de Node/Express (el de Felipe)
  pasa por acá, leyendo `EXPO_PUBLIC_API_URL` desde `.env`.

## Cómo correrlo

1. Copiar `.env.example` a `.env` y completar `EXPO_PUBLIC_API_URL` (URL del backend
   corriendo local) y `EXPO_PUBLIC_MAPBOX_TOKEN` (desde mapbox.com — mientras no lo
   completes, `MapaMaply` muestra un placeholder en vez de romper).
2. `npm install` (si no lo corriste ya).
3. `npx expo start` y abrir en Expo Go o en el navegador.

## Boilerplate del template que se puede borrar

`create-expo-app` trae de fábrica una demo (pantalla de bienvenida con tabs, ícono
animado, etc.) que no usamos. Quedó sin tocar por si querés mirarla de referencia,
pero se puede borrar tranquilamente:

- `src/app/explore.tsx`
- `src/components/animated-icon*.tsx`, `animated-icon.module.css`
- `src/components/app-tabs*.tsx`
- `src/components/hint-row.tsx`
- `src/components/themed-text.tsx`, `themed-view.tsx`
- `src/components/web-badge.tsx`
- `src/components/ui/collapsible.tsx`
- `scripts/reset-project.js` (y el script `reset-project` en `package.json`)

Nada de esto es del proyecto anterior de Valentina — es la demo estándar que trae
Expo para cualquier proyecto nuevo. Se puede borrar sin miedo, `index.tsx` y
`_layout.tsx` ya no la usan.
