# Maply Services — Backend (Node + Express + MySQL)

API REST de Maply Services: usuarios, lugares y reportes colaborativos del estado de cada lugar.

## Instalar y correr

1. Levantar XAMPP → iniciar los módulos **Apache** y **MySQL**.
2. Ir a `http://localhost/phpmyadmin`, crear una base llamada `maply_services` e importar, en este orden:
   1. `SQL - Maply Services.sql`
   2. `sql/tokens_revocados.sql`
   3. `sql/karma.sql`
   4. `sql/recuperacion_contrasena.sql`
   5. `sql/traduccion_reporte.sql`
   6. `sql/denuncias.sql`
   7. `sql/indices.sql`
3. `npm install`
4. `cp .env.example .env` y completar los datos (con XAMPP por defecto: usuario `root`, contraseña vacía).
5. `npm run dev`

Si arranca bien vas a ver en la terminal:
`Servidor de Maply Services escuchando en http://localhost:3000`

## Documentación de la API (Swagger)

Con el servidor corriendo: **http://localhost:3000/api-docs**

La especificación completa está en `openapi.json` (OpenAPI 3.0).

## Tests

```
npm test
```

Corre los tests unitarios de `test/` con el runner que trae Node (`node --test`). No necesitan la base de datos: el pool de MySQL se reemplaza por uno simulado.

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | No | Registrar usuario |
| POST | `/api/auth/login` | No | Iniciar sesión → `{ token, usuario }` |
| POST | `/api/auth/logout` | Sí | Cerrar sesión (revoca el token) |
| POST | `/api/auth/olvide-contrasena` | No | Código de recuperación por mail |
| POST | `/api/auth/restablecer-contrasena` | No | Cambiar contraseña con el código |
| DELETE | `/api/auth/cuenta` | Sí | Eliminar la cuenta propia |
| GET | `/api/lugares` | No | Listar lugares (`?categoria=` `?q=`) |
| POST | `/api/lugares` | Sí | Proponer un lugar |
| GET | `/api/reportes` | No | Últimos 200 reportes |
| POST | `/api/reportes` | Sí | Publicar un reporte |
| GET | `/api/reportes/:id` | No | Detalle de un reporte |
| GET | `/api/reportes/lugar/:id_lugar/estado-actual` | No | Estado del lugar en la última hora |
| GET | `/api/reportes/:id/traduccion?idioma=` | No | Traducir un reporte (es/en) |
| POST | `/api/reportes/:id/denuncias` | Sí | Denunciar un reporte |
| PATCH | `/api/admin/usuarios/:id/bloqueo` | Admin | Bloquear o desbloquear un usuario |

Auth = header `Authorization: Bearer <token>`. Admin = además, `id_rol` igual a `ADMIN_ROL_ID` del `.env`.

## Deploy

Ver el **Manual de Deploy - Maply Services**.
