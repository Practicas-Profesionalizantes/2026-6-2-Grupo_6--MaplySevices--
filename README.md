# Maply Services 

Aplicación móvil que permite a los usuarios consultar y reportar el estado en tiempo real de servicios y establecimientos cercanos (hospitales, bancos, transporte público, comercios, oficinas públicas, etc.), utilizando mapas interactivos y geolocalización.

---

## Tecnologías utilizadas

###  Frontend — App Móvil
| Tecnología | Uso |
|---|---|
| React Native + Expo | Framework principal de la app móvil |
| Expo Router | Navegación por pantallas (tipo file-system routing) |
| TypeScript | Tipado estático |
| NativeWind | Estilos con sintaxis de Tailwind CSS para React Native |
| @rnmapbox/maps | Mapas interactivos y geolocalización (Mapbox SDK) |
| i18next + expo-localization | Soporte multilingüe (español / inglés) |
| AsyncStorage | Almacenamiento persistente del token de sesión |

###  Backend — API REST
| Tecnología | Uso |
|---|---|
| Node.js + Express | Servidor y enrutamiento |
| MySQL (XAMPP) | Base de datos relacional |
| jsonwebtoken (JWT) | Autenticación por tokens con expiración |
| bcryptjs | Hash seguro de contraseñas |
| express-validator | Validación y sanitización de entradas |
| mysql2 | Conexión y pool de conexiones a MySQL |

---

## Requisitos previos

- **Node.js** v18 o superior — [descargar](https://nodejs.org/)
- **XAMPP** con MySQL corriendo en el puerto 3306 — [descargar](https://www.apachefriends.org/)
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI** (para compilar la app en dispositivo real): `npm install -g eas-cli`
- Cuenta en **Mapbox** para obtener el access token — [mapbox.com](https://www.mapbox.com/)

---

## Configuración

### 1. Base de datos

1. Iniciar XAMPP y verificar que MySQL esté corriendo (puerto 3306).
2. Abrir phpMyAdmin (`http://localhost/phpmyadmin`).
3. Crear la base de datos `maply_services`.
4. Importar `maply-backend/sql/maply_services.sql` (tablas principales).
5. Importar `maply-backend/sql/tokens_revocados.sql` (gestión de sesiones revocadas).

### 2. Backend

```bash
cd maply-backend
npm install
cp .env.example .env
# Editar .env con los datos reales (ver sección Variables de entorno)
node src/server.js
```

El servidor queda disponible en `http://localhost:3000`.

### 3. Frontend

```bash
cd maply-frontend
npm install
cp .env.example .env
# Editar .env con la URL de la API y el token de Mapbox
npx expo start
```

>  **Importante:** La integración con Mapbox requiere un **development build** (no funciona con la app Expo Go estándar).
> Para generar el build en Android: `eas build --profile development --platform android`

---

## Variables de entorno

Cada subcarpeta tiene un archivo `.env.example` con los campos necesarios. Copiar a `.env` y completar con los valores reales.

**El archivo `.env` nunca debe subirse al repositorio.** Ya está incluido en `.gitignore`.

---

## Estructura del proyecto

```
2026-6-2-Grupo_6--MaplySevices--/
│
├── maply-backend/                  # API REST (Node.js + Express)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # Pool de conexiones MySQL
│   │   ├── controllers/
│   │   │   ├── authController.js   # Registro, login, logout
│   │   │   ├── lugaresController.js
│   │   │   └── reportesController.js
│   │   ├── middleware/
│   │   │   └── auth.js             # Verificación JWT + blacklist
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── lugaresRoutes.js
│   │   │   └── reportesRoutes.js
│   │   ├── validators/
│   │   │   └── userRegistration.js
│   │   └── server.js               # Punto de entrada del servidor
│   ├── sql/
│   │   ├── maply_services.sql
│   │   └── tokens_revocados.sql
│   └── .env.example
│
└── maply-frontend/                 # App móvil (React Native + Expo)
    └── src/
        ├── app/                    # Pantallas (Expo Router)
        │   ├── _layout.tsx
        │   ├── index.tsx           # Pantalla principal (mapa)
        │   ├── login.tsx
        │   ├── register.tsx
        │   ├── create-report.tsx
        │   ├── report-details.tsx
        │   └── select-lugar.tsx
        ├── components/
        │   ├── Header.tsx
        │   ├── MapaMaply.tsx       # Capa de abstracción del mapa
        │   └── ReportCard.tsx
        ├── constants/
        │   ├── Colors.ts           # Paleta de colores Maply
        │   ├── categoriasLugar.ts
        │   └── categoriasReporte.ts
        ├── locales/
        │   ├── es.json             # Traducciones en español
        │   └── en.json             # Traducciones en inglés
        ├── services/
        │   └── api.ts              # Todas las llamadas HTTP a la API
        └── state/
            └── lugarSeleccionado.ts
```

---

## Endpoints de la API

| Método | Endpoint | Autenticación | Descripción |
|--------|----------|:---:|-------------|
| POST | `/api/auth/register` | ❌ | Registra un nuevo usuario. Recibe `nombre`, `email` y `password`. Hashea la contraseña con BCrypt y devuelve confirmación. |
| POST | `/api/auth/login` | ❌ | Inicia sesión. Recibe `email` y `password`, valida el hash y devuelve un token JWT con 7 días de expiración. |
| POST | `/api/auth/logout` | ✅ | Cierra la sesión del usuario. Invalida el token JWT agregándolo a la blacklist (`tokens_revocados`). |
| GET | `/api/lugares` | ✅ | Devuelve la lista de establecimientos. Acepta el parámetro opcional `?categoria=` para filtrar por tipo de lugar. |
| POST | `/api/reportes` | ✅ | Crea un reporte sobre un establecimiento. Recibe `id_lugar`, `categoria_reporte` y `descripcion`. |

Los endpoints con ✅ requieren el header: `Authorization: Bearer <token>`

---

## Equipo

**Grupo 6 — 6° Año 2° División — Prácticas Profesionalizantes 2026**

| Nombre | Rol |
|---|---|
| Felipe Kuo Lee | Desarrollo |
| Brunella Figallo | Desarrollo |
| Juan Pablo Llanos | Team |
| Valentina Palacios | Team |
| Lucca Martinez | Team |

---

## Licencia

Proyecto académico — Escuela Técnica 32 "General José de San Martín" — 2026
