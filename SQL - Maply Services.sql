DROP DATABASE IF EXISTS maply_services;
CREATE DATABASE maply_services;
USE maply_services;

-- ============================================
-- TABLA: usuario
-- ============================================
CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL, -- bcrypt
    rol ENUM('comun', 'registrado', 'admin') DEFAULT 'comun',
    telefono VARCHAR(20) NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    -- Auditoría: última conexión (opcional)
    ultima_conexion DATETIME NULL
);

-- ============================================
-- TABLA: lugar
-- ============================================
CREATE TABLE lugar (
    id_lugar INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    categoria ENUM('hospital', 'banco', 'restaurante', 'transporte', 'comercio', 'oficina_publica', 'otro') NOT NULL,
    latitud DECIMAL(10,8) NULL,
    longitud DECIMAL(11,8) NULL,
    direccion VARCHAR(255) NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: reporte
-- ============================================
CREATE TABLE reporte (
    id_reporte INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_lugar INT NOT NULL,
    contenido TEXT NOT NULL,
    categoria_reporte ENUM('mucha_fila', 'lugar_lleno', 'cerrado', 'demora', 'atencion_rapida', 'poco_movimiento', 'cambio_recorrido', 'otro') NOT NULL,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE, -- baja lógica
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_lugar) REFERENCES lugar(id_lugar) ON DELETE CASCADE,
    INDEX idx_lugar_fecha (id_lugar, fecha_hora DESC),
    INDEX idx_usuario (id_usuario)
);

-- ============================================
-- TABLA: denuncia (a reportes)
-- ============================================
CREATE TABLE denuncia (
    id_denuncia INT AUTO_INCREMENT PRIMARY KEY,
    id_reporte INT NOT NULL,
    id_usuario_denunciante INT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'revisada', 'desestimada', 'aceptada') DEFAULT 'pendiente',
    FOREIGN KEY (id_reporte) REFERENCES reporte(id_reporte) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_denunciante) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    INDEX idx_reporte (id_reporte),
    INDEX idx_estado (estado)
);

-- ============================================
-- TABLA: favorito (usuarios guardan lugares)
-- ============================================
CREATE TABLE favorito (
    id_favorito INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_lugar INT NOT NULL,
    fecha_agregado DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_lugar) REFERENCES lugar(id_lugar) ON DELETE CASCADE,
    UNIQUE KEY uk_usuario_lugar (id_usuario, id_lugar) -- Evita duplicados
);

-- ============================================
-- TABLA: notificacion
-- ============================================
CREATE TABLE notificacion (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('email', 'in_app') DEFAULT 'in_app',
    fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    INDEX idx_usuario_leida (id_usuario, leida)
);

-- ============================================
-- TABLA: historial_administrador (auditoría)
-- ============================================
CREATE TABLE historial_admin (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_admin INT NOT NULL,
    accion VARCHAR(255) NOT NULL,
    id_afectado INT NULL, -- Puede ser id_reporte o id_usuario
    tipo_afectado ENUM('reporte', 'usuario') NULL,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_admin) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    INDEX idx_admin_fecha (id_admin, fecha_hora DESC)
);

-- ============================================
-- DATOS DE EJEMPLO (para pruebas)
-- ============================================

-- Insertar lugares de ejemplo
INSERT INTO lugar (nombre, categoria, latitud, longitud, direccion) VALUES
('Hospital Alemán', 'hospital', -34.5889, -58.3975, 'Av. Pueyrredón 1640, CABA'),
('Banco Nación', 'banco', -34.6037, -58.3816, 'Plaza de Mayo, CABA'),
('McDonald\'s Cabildo', 'restaurante', -34.5622, -58.4486, 'Av. Cabildo 2200, CABA'),
('Estación Retiro', 'transporte', -34.5914, -58.3755, 'Retiro, CABA');

-- Insertar usuarios (contraseña en texto plano para ejemplo, en producción usar hash)
-- NOTA: Las contraseñas aquí son simuladas. En producción usar bcrypt.
INSERT INTO usuario (nombre, email, contrasena_hash, rol) VALUES
('Usuario Comun', 'comun@test.com', '$2a$10$ejemploHashParaComun', 'comun'),
('Usuario Registrado', 'registrado@test.com', '$2a$10$ejemploHashParaRegistrado', 'registrado'),
('Admin Maply', 'admin@maply.com', '$2a$10$ejemploHashParaAdmin', 'admin');

-- Insertar reportes de ejemplo
INSERT INTO reporte (id_usuario, id_lugar, contenido, categoria_reporte) VALUES
(2, 1, 'La guardia tiene más de 2 horas de espera', 'demora'),
(2, 2, 'Solo 2 cajas abiertas, fila larga', 'mucha_fila'),
(2, 3, 'Local al 70% de capacidad, se puede entrar', 'lugar_lleno'),
(2, 4, 'Colectivos funcionando normalmente, sin demoras', 'atencion_rapida');

-- Insertar favoritos de ejemplo
INSERT INTO favorito (id_usuario, id_lugar) VALUES
(2, 1),
(2, 3);

-- Insertar denuncia de ejemplo
INSERT INTO denuncia (id_reporte, id_usuario_denunciante, motivo, estado) VALUES
(1, 1, 'Información falsa, la guardia tenía poca espera', 'pendiente');

-- Insertar notificación de ejemplo
INSERT INTO notificacion (id_usuario, mensaje, tipo) VALUES
(2, 'Tu reporte sobre Hospital Alemán ha sido denunciado', 'in_app');

-- Insertar historial de administrador
INSERT INTO historial_admin (id_admin, accion, id_afectado, tipo_afectado) VALUES
(3, 'Eliminó reporte por contenido inapropiado', 1, 'reporte');

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Reportes recientes (últimas 24h)
CREATE VIEW reportes_recientes AS
SELECT r.id_reporte, u.nombre AS usuario, l.nombre AS lugar, 
       r.contenido, r.categoria_reporte, r.fecha_hora
FROM reporte r
JOIN usuario u ON r.id_usuario = u.id_usuario
JOIN lugar l ON r.id_lugar = l.id_lugar
WHERE r.activo = 1 AND r.fecha_hora >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY r.fecha_hora DESC;

-- Vista: Ranking de lugares más reportados
CREATE VIEW ranking_lugares_mas_reportados AS
SELECT l.id_lugar, l.nombre, COUNT(r.id_reporte) AS total_reportes
FROM lugar l
LEFT JOIN reporte r ON l.id_lugar = r.id_lugar AND r.activo = 1
GROUP BY l.id_lugar
ORDER BY total_reportes DESC;

-- ============================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================

-- Procedimiento para publicar un reporte (con validación de usuario activo)
DELIMITER //
CREATE PROCEDURE sp_publicar_reporte(
    IN p_id_usuario INT,
    IN p_id_lugar INT,
    IN p_contenido TEXT,
    IN p_categoria VARCHAR(50)
)
BEGIN
    DECLARE v_usuario_activo BOOLEAN;
    DECLARE v_lugar_activo BOOLEAN;
    
    -- Validar que el usuario esté activo y tenga rol registrado o admin
    SELECT activo INTO v_usuario_activo FROM usuario WHERE id_usuario = p_id_usuario;
    SELECT activo INTO v_lugar_activo FROM lugar WHERE id_lugar = p_id_lugar;
    
    IF v_usuario_activo != 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario inactivo o no existe';
    END IF;
    
    IF v_lugar_activo != 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lugar inactivo o no existe';
    END IF;
    
    INSERT INTO reporte (id_usuario, id_lugar, contenido, categoria_reporte)
    VALUES (p_id_usuario, p_id_lugar, p_contenido, p_categoria);
    
    -- Opcional: registrar en notificaciones a los favoritos del lugar
    -- (se puede implementar con un trigger)
END //
DELIMITER ;

-- ============================================
-- TRIGGER: Notificar a favoritos cuando hay nuevo reporte
-- ============================================
DELIMITER //
CREATE TRIGGER after_reporte_insert
AFTER INSERT ON reporte
FOR EACH ROW
BEGIN
    INSERT INTO notificacion (id_usuario, mensaje, tipo)
    SELECT f.id_usuario, 
           CONCAT('Nuevo reporte en ', l.nombre, ': ', NEW.categoria_reporte),
           'in_app'
    FROM favorito f
    JOIN lugar l ON f.id_lugar = l.id_lugar
    WHERE f.id_lugar = NEW.id_lugar;
END //
DELIMITER ;