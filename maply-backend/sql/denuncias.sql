-- Denuncias a reportes (POST /api/reportes/:id/denuncias).
-- Es la tabla tal como está en la base real (DESCRIBE del 27/09/2026), que
-- difiere de "SQL - Maply Services.sql": fecha_denuncia, sin estado 'aceptada'.
-- IF NOT EXISTS: si la tabla ya existe, este script no cambia nada.

USE maply_services;

CREATE TABLE IF NOT EXISTS denuncia (
    id_denuncia INT AUTO_INCREMENT PRIMARY KEY,
    id_reporte INT NOT NULL,
    id_usuario_denunciante INT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    estado ENUM('pendiente', 'revisada', 'desestimada') DEFAULT 'pendiente',
    fecha_denuncia DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_denuncia_reporte FOREIGN KEY (id_reporte) REFERENCES reporte(id_reporte) ON DELETE CASCADE,
    CONSTRAINT fk_denuncia_usuario FOREIGN KEY (id_usuario_denunciante) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);
