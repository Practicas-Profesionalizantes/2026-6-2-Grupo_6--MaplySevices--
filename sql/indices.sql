-- Índices para las consultas más frecuentes de la API.
-- Correr DESPUÉS de "SQL - Maply Services.sql". Si se corre dos veces, MySQL
-- avisa "Duplicate key name": no pasa nada, el índice ya existe.

USE maply_services;

-- Búsqueda de lugares por zona del mapa (rango de latitud/longitud).
-- Es un índice compuesto común; uno SPATIAL necesitaría una columna POINT.
CREATE INDEX idx_lugar_coordenadas ON lugar (latitud, longitud);

-- Estado actual de un lugar: reportes activos de la última hora (GET /reportes/lugar/:id/estado-actual).
CREATE INDEX idx_reporte_lugar_fecha ON reporte (id_lugar, activo, fecha_registro);

-- Límite de un reporte por usuario por lugar por hora (POST /reportes).
CREATE INDEX idx_reporte_usuario_lugar_fecha ON reporte (id_usuario, id_lugar, fecha_registro);
