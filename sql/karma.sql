-- Sistema de reputación/karma (SCRUM-270).
-- Solo toca `usuario.karma` y `reporte.id_usuario`, que son las dos únicas
-- columnas confirmadas contra la base real de Brune (DESCRIBE usuario /
-- reporte) — no asume nada sobre `rol` (tabla aparte) ni sobre el nombre
-- exacto de la columna de fecha en `reporte`, que difieren de
-- "SQL - Maply Services.sql" (el script original quedó desactualizado
-- frente a la base real, ver auditoría de julio).
--
-- Correr DESPUÉS de "SQL - Maply Services.sql" y "tokens_revocados.sql".

USE maply_services;

ALTER TABLE usuario ADD COLUMN karma INT NOT NULL DEFAULT 0;

-- Cada reporte publicado suma 1 punto de karma a quien lo publicó. Es el
-- algoritmo "básico" pedido en el ticket; queda fácil de ampliar después
-- (ej. restar karma si un reporte es denunciado y aceptado en `denuncia`).
DELIMITER //
CREATE TRIGGER after_reporte_insert_karma
AFTER INSERT ON reporte
FOR EACH ROW
BEGIN
    UPDATE usuario SET karma = karma + 1 WHERE id_usuario = NEW.id_usuario;
END //
DELIMITER ;
