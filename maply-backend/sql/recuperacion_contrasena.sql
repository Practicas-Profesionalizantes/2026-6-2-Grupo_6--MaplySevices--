-- Códigos de "olvidé mi contraseña". Un código activo por usuario: pedir uno
-- nuevo pisa al anterior. Se guarda el hash (SHA-256), nunca el código.
-- Correr DESPUÉS de importar "SQL - Maply Services.sql".

USE maply_services;

CREATE TABLE IF NOT EXISTS recuperacion_contrasena (
    id_usuario INT PRIMARY KEY,
    codigo_hash CHAR(64) NOT NULL,
    fecha_expiracion DATETIME NOT NULL,
    intentos INT NOT NULL DEFAULT 0,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);
