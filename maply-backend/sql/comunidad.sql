-- Votos, comentarios y notificaciones de favoritos (Términos y condiciones,
-- punto 3: "emitir votos de validación, añadir comentarios, guardar lugares
-- en favoritos"). Las tablas `favorito` y `notificacion` ya existían.
-- Correr UNA sola vez sobre una base que ya tiene el script principal:
--   phpMyAdmin > Importar, o
--   node scripts/importar-db.js sql/comunidad.sql ca.pem
USE maply_services;

-- Un voto por usuario por reporte: +1 (sirve) o -1 (no coincide).
CREATE TABLE voto_reporte (
  id_reporte int(11) NOT NULL,
  id_usuario int(11) NOT NULL,
  valor tinyint(1) NOT NULL,
  fecha datetime DEFAULT current_timestamp(),
  PRIMARY KEY (id_reporte, id_usuario),
  KEY fk_voto_usuario (id_usuario),
  CONSTRAINT chk_voto_valor CHECK (valor IN (-1, 1)),
  CONSTRAINT fk_voto_reporte FOREIGN KEY (id_reporte) REFERENCES reporte (id_reporte) ON DELETE CASCADE,
  CONSTRAINT fk_voto_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Comentarios sobre un reporte. Baja lógica (activo = 0), como los reportes.
CREATE TABLE comentario (
  id_comentario int(11) NOT NULL AUTO_INCREMENT,
  id_reporte int(11) NOT NULL,
  id_usuario int(11) NOT NULL,
  contenido varchar(280) NOT NULL,
  fecha datetime DEFAULT current_timestamp(),
  activo tinyint(1) DEFAULT 1,
  PRIMARY KEY (id_comentario),
  KEY idx_comentario_reporte (id_reporte, activo, fecha),
  KEY fk_comentario_usuario (id_usuario),
  CONSTRAINT fk_comentario_reporte FOREIGN KEY (id_reporte) REFERENCES reporte (id_reporte) ON DELETE CASCADE,
  CONSTRAINT fk_comentario_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Cada notificación apunta al reporte que la generó, para abrirlo desde la app.
ALTER TABLE notificacion
  ADD COLUMN id_reporte int(11) NULL AFTER id_usuario,
  ADD KEY idx_notificacion_usuario_fecha (id_usuario, leida, fecha_notificacion),
  ADD CONSTRAINT fk_notificacion_reporte FOREIGN KEY (id_reporte) REFERENCES reporte (id_reporte) ON DELETE CASCADE;
