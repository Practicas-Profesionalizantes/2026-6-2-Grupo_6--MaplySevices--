# Maply Services — Backend (Node + Express + MySQL)

## De dónde sale este código

En el repo de GitHub (rama `Documentación`) ya existían dos archivos sueltos en la
raíz: `authRoutes.js` y `userRegistration.js` (este último vacío). No había
`controllers/authController.js`, ni `server.js`, ni conexión a la base de datos, así
que no era posible correr un servidor todavía. Esta carpeta completa esas piezas
que faltaban, respetando el diseño que ya estaba pensado (mismas rutas, mismos
nombres de función, misma idea de validación en `userRegistration.js`).

**Importante:** si Felipe tiene más avance de esto guardado localmente y todavía no
lo subió al repo, convendría comparar antes de que esto reemplace su trabajo — esta
carpeta es un punto de partida funcional, no necesariamente la versión final.

## Instalar y correr

1. Levantar XAMPP → iniciar los módulos **Apache** y **MySQL**.
2. Ir a `http://localhost/phpmyadmin`, crear una base llamada `maply_services` e
   importar `SQL - Maply Services.sql` (Importar → elegir archivo → Continuar).
3. `npm install`
4. `cp .env.example .env` y completar los datos (con XAMPP por defecto:
   usuario `root`, contraseña vacía).
5. `npm run dev`

Si arranca bien vas a ver en la terminal:
`Servidor de Maply Services escuchando en http://localhost:3000`

Podés probarlo abriendo `http://localhost:3000` en el navegador — debería devolver
un JSON `{"ok":true,...}`.

## Endpoints disponibles

- `POST /api/auth/register` — `{ nombre, email, contrasena, telefono? }`
- `POST /api/auth/login` — `{ email, contrasena }` → devuelve `{ token, usuario }`
- `POST /api/auth/logout` — requiere header `Authorization: Bearer <token>`
- `GET /api/reportes` — lista de reportes activos
- `GET /api/reportes/:id` — detalle de un reporte
- `POST /api/reportes` — requiere `Authorization: Bearer <token>`, body
  `{ id_lugar, contenido, categoria_reporte }`

Esto es exactamente lo que ya espera `src/services/api.ts` en el proyecto de frontend
(`maply-frontend`), así que apuntando `EXPO_PUBLIC_API_URL=http://localhost:3000/api`
en el `.env` del frontend, debería conectar sin cambios.
