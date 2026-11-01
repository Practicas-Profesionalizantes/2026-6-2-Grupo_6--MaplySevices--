USE maply_services;

ALTER TABLE reporte 
    ADD COLUMN tiempo_estimado_minutos INT NULL AFTER categoria_reporte,
    ADD COLUMN votos_positivos INT DEFAULT 0 AFTER activo,
    ADD COLUMN votos_negativos INT DEFAULT 0 AFTER votos_positivos;

CREATE TABLE voto_reporte (
    id_voto INT AUTO_INCREMENT PRIMARY KEY,
    id_reporte INT NOT NULL,
    id_usuario INT NOT NULL,
    tipo_voto ENUM('positivo', 'negativo') NOT NULL,
    fecha_voto DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_usuario_reporte UNIQUE (id_usuario, id_reporte),
    FOREIGN KEY (id_reporte) REFERENCES reporte(id_reporte) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    INDEX idx_reporte_voto (id_reporte)
);

CREATE TABLE comentario_reporte (
    id_comentario INT AUTO_INCREMENT PRIMARY KEY,
    id_reporte INT NOT NULL,
    id_usuario INT NOT NULL,
    contenido TEXT NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_reporte) REFERENCES reporte(id_reporte) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    INDEX idx_reporte_comentario (id_reporte, fecha_registro DESC)
);


DELIMITER //

CREATE TRIGGER after_voto_insert
AFTER INSERT ON voto_reporte
FOR EACH ROW
BEGIN
    IF NEW.tipo_voto = 'positivo' THEN
        UPDATE reporte SET votos_positivos = votos_positivos + 1 WHERE id_reporte = NEW.id_reporte;
    ELSEIF NEW.tipo_voto = 'negativo' THEN
        UPDATE reporte SET votos_negativos = votos_negativos + 1 WHERE id_reporte = NEW.id_reporte;
    END IF;
END //

DROP PROCEDURE IF EXISTS sp_publicar_reporte //

CREATE PROCEDURE sp_publicar_reporte(
    IN p_id_usuario INT,
    IN p_id_lugar INT,
    IN p_contenido TEXT,
    IN p_categoria ENUM('mucha_fila', 'lugar_lleno', 'cerrado', 'demora', 'atencion_rapida', 'poco_movimiento', 'cambio_recorrido', 'otro'),
    IN p_tiempo_estimado INT
)
BEGIN
    DECLARE v_usuario_activo BOOLEAN;
    DECLARE v_lugar_activo BOOLEAN;
    
    SELECT activo INTO v_usuario_activo FROM usuario WHERE id_usuario = p_id_usuario;
    SELECT activo INTO v_lugar_activo FROM lugar WHERE id_lugar = p_id_lugar;
    
    IF v_usuario_activo != 1 OR v_usuario_activo IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario inactivo o no existe';
    END IF;
    
    IF v_lugar_activo != 1 OR v_lugar_activo IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lugar inactivo o no existe';
    END IF;
    
    INSERT INTO reporte (id_usuario, id_lugar, contenido, categoria_reporte, tiempo_estimado_minutos)
    VALUES (p_id_usuario, p_id_lugar, p_contenido, p_categoria, p_tiempo_estimado);
END //

DELIMITER ;

CALL sp_publicar_reporte(2, 1, 'Mucha demora en la guardia de emergencias.', 'demora', 120);

INSERT INTO voto_reporte (id_reporte, id_usuario, tipo_voto) VALUES 
(1, 1, 'positivo'),
(1, 3, 'positivo');

INSERT INTO comentario_reporte (id_reporte, id_usuario, contenido) VALUES
(1, 1, 'Confirmo la demora, acabo de llegar y la sala está llena.');