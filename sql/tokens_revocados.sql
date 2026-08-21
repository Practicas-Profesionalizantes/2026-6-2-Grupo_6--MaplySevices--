-- Esta tabla NO está incluida en "SQL - Maply Services.sql" — vive en un
-- documento aparte ("Tabla SQL para almacenamiento de tokens de sesión
-- revocados") que además tenía nombres de columna/tabla inconsistentes con
-- el esquema real (usaba `usuarios(id)` en vez de `usuario(id_usuario)`).
-- Esta versión ya está corregida para que combine con el resto del esquema.
--
-- v2: además se cambió TIMESTAMP por DATETIME en las dos columnas de fecha.
-- El error "#1067 - Valor por defecto inválido para 'fecha_expiracion'" pasa
-- porque MySQL/MariaDB en modo estricto no deja tener una segunda columna
-- TIMESTAMP NOT NULL sin default explícito cuando ya hay otra con
-- DEFAULT CURRENT_TIMESTAMP. El resto del esquema (fecha_registro,
-- fecha_hora, etc.) ya usa DATETIME en vez de TIMESTAMP — esto lo alinea y
-- de paso evita el error.
--
-- Correr DESPUÉS de importar "SQL - Maply Services.sql".

USE maply_services;

DROP TABLE IF EXISTS tokens_revocados;

CREATE TABLE tokens_revocados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(500) NOT NULL,
    id_usuario INT NOT NULL,
    fecha_revocacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME NOT NULL,
    INDEX (token),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);
