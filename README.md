# Maply Services

Aplicación móvil que permite consultar y reportar en tiempo real el estado de lugares y servicios cercanos (hospitales, bancos, transporte público, comercios, oficinas públicas, etc.): filas, demoras, cierres o poco movimiento, sobre un mapa interactivo con geolocalización.

**En producción**
- API: https://maply-backend-3sxm.onrender.com
- Documentación de la API (Swagger): https://maply-backend-3sxm.onrender.com/api-docs

> El servidor está en el plan gratuito de Render: si pasa 15 minutos sin uso se apaga y la primera respuesta puede tardar hasta un minuto.

---

## Tecnologías

### Frontend — app móvil (`maply-frontend/`)
| Tecnología | Uso |
|---|---|
| React Native + Expo | App para Android, iOS y web con un mismo código |
| Expo Router | Navegación por pantallas (basada en archivos) |
| TypeScript | Tipado estático |
| NativeWind | Estilos con sintaxis de Tailwind CSS |
| @rnmapbox/maps | Mapa interactivo (Mapbox), detrás de la capa propia `MapaMaply` |
| expo-location | Ubicación GPS del usuario |
| i18next + expo-localization | Español e inglés |
| expo-secure-store | Guarda el token de sesión cifrado |

### Backend — API REST (`maply-backend/`)
| Tecnología | Uso |
|---|---|
| Node.js + Express | Servidor y rutas |
| MySQL | Base de datos relacional |
| jsonwebtoken (JWT) | Autenticación con tokens de 1 día y lista de tokens revocados |
| bcryptjs | Hash de contraseñas |
| express-validator | Validación de datos de entrada |
| helmet, cors, express-rate-limit | Cabeceras de seguridad, orígenes permitidos y límite de pedidos |
| swagger-ui-express | Documentación interactiva en `/api-docs` |

### Infraestructura
| Servicio | Uso |
|---|---|
| Render | Hosting del backend (se despliega solo con cada push a `main`) |
| Aiven | Base MySQL en la nube (conexión cifrada) |
| GitHub Actions | Corre los tests del backend en cada push a `main` |
| EAS Build (Expo) | Genera la APK de Android |

---

## Requisitos previos

- **Node.js** 18 o superior
- **XAMPP** con MySQL en el puerto 3306 (solo para desarrollo local)
- **Android Studio** con un emulador, o un celular Android
- **EAS CLI** para generar la APK: `npm install -g eas-cli`
- Token público de **Mapbox** ([mapbox.com](https://www.mapbox.com/))

---

## Puesta en marcha local

### 1. Base de datos
1. Iniciar XAMPP (Apache y MySQL).
2. En phpMyAdmin (`http://localhost/phpmyadmin`), pestaña **Importar**, importar `SQL - Maply Services.sql` (raíz del repo). Crea la base `maply_services` con todas las tablas, roles, trigger de karma, índices y 27 lugares de prueba. Después importar también `maply-backend/sql/comunidad.sql` (votos, comentarios y notificaciones de favoritos).

### 2. Backend
```bash
cd maply-backend
npm install
cp .env.example .env     # completar los valores (ver comentarios del archivo)
npm run dev              # o: npm start
```
Queda en `http://localhost:3000` y la documentación en `http://localhost:3000/api-docs`.

Tests: `npm test`

### 3. Frontend
```bash
cd maply-frontend
npm install
cp .env.example .env     # EXPO_PUBLIC_API_URL y EXPO_PUBLIC_MAPBOX_TOKEN
npx expo run:android     # compila e instala la app en el emulador
```
> Mapbox es un módulo nativo: la app **no funciona en Expo Go**. La primera vez hay que compilarla con `npx expo run:android`; después alcanza con `npx expo start --dev-client`.

Para usar el backend de producción en lugar del local:
`EXPO_PUBLIC_API_URL=https://maply-backend-3sxm.onrender.com/api`

---

## Deploy

Ver **Manual de Deploy - Maply Services.docx**. Resumen:
- **Base de datos (Aiven):** se importa con `maply-backend/scripts/importar-db.js`.
- **Backend (Render):** Web Service con Root Directory `maply-backend`, `npm install` / `npm start` y las variables de `.env.example` (en producción, además `DB_PORT`, `DB_SSL_CA` y `TRUST_PROXY=1`).
- **App:** `eas build -p android --profile preview` genera la APK.

---

## Endpoints principales

Todas las rutas van bajo `/api`. La lista completa (25 endpoints), con ejemplos, está en Swagger.

| Método | Endpoint | Sesión | Descripción |
|---|---|:---:|---|
| POST | `/auth/register` | — | Crea una cuenta |
| POST | `/auth/login` | — | Devuelve el token JWT |
| POST | `/auth/logout` | ✅ | Revoca el token actual |
| POST | `/auth/olvide-contrasena` | — | Envía un código para recuperar la contraseña |
| GET | `/lugares?lat=&lng=&categoria=&q=` | — | Lugares por cercanía, categoría o nombre |
| POST | `/lugares` | ✅ | Propone un lugar nuevo |
| GET | `/reportes` | — | Últimos reportes |
| POST | `/reportes` | ✅ | Publica un reporte (suma karma) |
| GET | `/reportes/lugar/{id}/estado-actual` | — | Estado del lugar en la última hora |
| GET | `/reportes/{id}/traduccion?idioma=` | — | Traduce un reporte (es ↔ en) |
| DELETE | `/reportes/{id}` | ✅ | Elimina un reporte propio (el admin, cualquiera) |
| POST | `/reportes/{id}/denuncias` | ✅ | Denuncia un reporte (3 denuncias lo ocultan) |
| PUT | `/reportes/{id}/voto` | ✅ | Vota un reporte: 1 sirve, -1 no coincide, 0 saca el voto |
| GET / POST | `/reportes/{id}/comentarios` | POST ✅ | Lee o publica comentarios de un reporte |
| GET | `/favoritos` · PUT / DELETE `/favoritos/{id_lugar}` | ✅ | Lugares guardados |
| GET | `/notificaciones` · PATCH `/notificaciones/leidas` | ✅ | Avisos de reportes nuevos en tus favoritos |
| PATCH | `/admin/usuarios/{id}/bloqueo` | ✅ admin | Bloquea o desbloquea un usuario |

Las rutas con ✅ requieren el header `Authorization: Bearer <token>`.

---

## Estructura del repositorio

```
├── maply-backend/            API REST (Node.js + Express)
│   ├── src/
│   │   ├── config/           Conexión a MySQL y envío de mails
│   │   ├── controllers/      auth, lugares, reportes, admin
│   │   ├── middleware/       Verificación de JWT y token revocado
│   │   ├── routes/
│   │   ├── validators/
│   │   └── server.js
│   ├── sql/                  Scripts incrementales (karma, denuncias, índices...)
│   ├── scripts/              importar-db.js, reset-password.js
│   ├── test/                 Tests unitarios (node --test)
│   └── openapi.json          Especificación de la API (Swagger)
├── maply-frontend/           App (React Native + Expo)
│   └── src/
│       ├── app/              Pantallas (Expo Router)
│       ├── components/       MapaMaply, ReportCard, UI
│       ├── constants/        Colores, categorías, i18n
│       ├── hooks/            Ubicación, tema
│       ├── locales/          es.json, en.json
│       └── services/api.ts   Llamadas a la API
├── .github/workflows/ci.yml  Integración continua
├── old/                      Archivos de versiones anteriores
└── *.docx, *.pdf, *.drawio   Documentación y diagramas del proyecto
```

---

## Equipo

**Grupo 6 — 6° 2° — Prácticas Profesionalizantes 2026**
Escuela Técnica N°32 D.E. 14 "Gral. José de San Martín"

| Integrante |
|---|
| Brunella Figallo |
| Felipe Kuo Lee |
| Lucca Martinez |

Participaron en la primera etapa: Juan Pablo Llanos y Valentina Palacios.

Docentes: Prof. Damián Olaso y Prof. Gonzalo Consorti.
