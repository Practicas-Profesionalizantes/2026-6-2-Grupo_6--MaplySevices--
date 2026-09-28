-- Caché de traducciones del texto de los reportes ("Ver traducción").
-- Cada reporte se traduce una sola vez por idioma; si el reporte se borra,
-- se borran sus traducciones.
-- Correr DESPUÉS de importar "SQL - Maply Services.sql".

USE maply_services;

CREATE TABLE IF NOT EXISTS traduccion_reporte (
    id_reporte INT NOT NULL,
    idioma CHAR(2) NOT NULL,
    texto VARCHAR(1000) NOT NULL,
    PRIMARY KEY (id_reporte, idioma),
    FOREIGN KEY (id_reporte) REFERENCES reporte(id_reporte) ON DELETE CASCADE
);
