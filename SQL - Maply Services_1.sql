-- ============================================================
-- Maply Services — Script de base de datos (MySQL 8 / MariaDB 10.4+)
-- Estructura real de la base usada por el backend (maply-backend),
-- exportada de la base de desarrollo en noviembre de 2026.
-- Reemplaza a la versión de mayo, que tenía el rol como ENUM dentro de
-- `usuario`; hoy el rol es una tabla aparte (`rol`) referenciada por id_rol.
--
-- Incluye: 10 tablas, el trigger de karma, los 3 roles, los índices de rendimiento
-- y 27 lugares reales de Villa Urquiza para pruebas.
-- No incluye usuarios ni reportes (datos personales).
--
-- Importar en phpMyAdmin (pestaña Importar) o con:
--   mysql -u root --default-character-set=utf8mb4 < "SQL - Maply Services.sql"
-- ============================================================

/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `maply_services` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `maply_services`;
DROP TABLE IF EXISTS `denuncia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `denuncia` (
  `id_denuncia` int(11) NOT NULL AUTO_INCREMENT,
  `id_reporte` int(11) NOT NULL,
  `id_usuario_denunciante` int(11) NOT NULL,
  `motivo` varchar(255) NOT NULL,
  `estado` enum('pendiente','revisada','desestimada') DEFAULT 'pendiente',
  `fecha_denuncia` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_denuncia`),
  KEY `fk_denuncia_reporte` (`id_reporte`),
  KEY `fk_denuncia_usuario` (`id_usuario_denunciante`),
  CONSTRAINT `fk_denuncia_reporte` FOREIGN KEY (`id_reporte`) REFERENCES `reporte` (`id_reporte`) ON DELETE CASCADE,
  CONSTRAINT `fk_denuncia_usuario` FOREIGN KEY (`id_usuario_denunciante`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `favorito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorito` (
  `id_usuario` int(11) NOT NULL,
  `id_lugar` int(11) NOT NULL,
  `fecha_guardado` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_usuario`,`id_lugar`),
  KEY `fk_favorito_lugar` (`id_lugar`),
  CONSTRAINT `fk_favorito_lugar` FOREIGN KEY (`id_lugar`) REFERENCES `lugar` (`id_lugar`) ON DELETE CASCADE,
  CONSTRAINT `fk_favorito_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `lugar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lugar` (
  `id_lugar` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `categoria` enum('hospital','banco','restaurante','transporte','comercio','oficina_publica','otro') NOT NULL,
  `latitud` decimal(10,8) DEFAULT NULL,
  `longitud` decimal(11,8) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_lugar`),
  KEY `idx_lugar_coordenadas` (`latitud`,`longitud`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacion` (
  `id_notificacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `mensaje` varchar(255) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `leida` tinyint(1) DEFAULT 0,
  `fecha_notificacion` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_notificacion`),
  KEY `fk_notificacion_usuario` (`id_usuario`),
  CONSTRAINT `fk_notificacion_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `recuperacion_contrasena`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `recuperacion_contrasena` (
  `id_usuario` int(11) NOT NULL,
  `codigo_hash` char(64) NOT NULL,
  `fecha_expiracion` datetime NOT NULL,
  `intentos` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_usuario`),
  CONSTRAINT `recuperacion_contrasena_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `reporte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reporte` (
  `id_reporte` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `id_lugar` int(11) NOT NULL,
  `contenido` text NOT NULL,
  `categoria_reporte` varchar(50) NOT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  `activo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id_reporte`),
  KEY `fk_reporte_usuario` (`id_usuario`),
  KEY `fk_reporte_lugar` (`id_lugar`),
  KEY `idx_reporte_lugar_fecha` (`id_lugar`,`activo`,`fecha_registro`),
  KEY `idx_reporte_usuario_lugar_fecha` (`id_usuario`,`id_lugar`,`fecha_registro`),
  CONSTRAINT `fk_reporte_lugar` FOREIGN KEY (`id_lugar`) REFERENCES `lugar` (`id_lugar`) ON DELETE CASCADE,
  CONSTRAINT `fk_reporte_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50003 TRIGGER after_reporte_insert_karma
AFTER INSERT ON reporte
FOR EACH ROW
BEGIN
    UPDATE usuario SET karma = karma + 1 WHERE id_usuario = NEW.id_usuario;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol` (
  `id_rol` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tokens_revocados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tokens_revocados` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(500) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `fecha_revocacion` datetime DEFAULT current_timestamp(),
  `fecha_expiracion` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `token` (`token`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `tokens_revocados_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `traduccion_reporte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `traduccion_reporte` (
  `id_reporte` int(11) NOT NULL,
  `idioma` char(2) NOT NULL,
  `texto` varchar(1000) NOT NULL,
  PRIMARY KEY (`id_reporte`,`idioma`),
  CONSTRAINT `traduccion_reporte_ibfk_1` FOREIGN KEY (`id_reporte`) REFERENCES `reporte` (`id_reporte`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `contrasena_hash` varchar(255) NOT NULL,
  `id_rol` int(11) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  `activo` tinyint(1) DEFAULT 1,
  `ultima_conexion` datetime DEFAULT NULL,
  `karma` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_usuario_rol` (`id_rol`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


-- ------------------------------------------------------------
-- Datos base: roles
-- ------------------------------------------------------------
USE `maply_services`;
/*M!999999\- enable the sandbox mode */ 
LOCK TABLES `rol` WRITE;
INSERT INTO `rol` VALUES
(1,'comun','Usuario común / vecino que reporta'),
(2,'registrado','Usuario registrado con cuenta verificada'),
(3,'admin','Administrador del sistema');
UNLOCK TABLES;

-- ------------------------------------------------------------
-- Datos de prueba: lugares reales de Villa Urquiza (CABA)
-- ------------------------------------------------------------
INSERT INTO `lugar` VALUES (1,'Supermercado Carrefour Express','comercio',-34.57142000,-58.48785000,'Av. Triunvirato 4230, CABA',1,'2026-07-28 00:24:16');
INSERT INTO `lugar` VALUES (2,'Farmacity Villa Urquiza','comercio',-34.57215000,-58.48671000,'Av. Triunvirato 4099, CABA',1,'2026-07-28 00:24:16');
INSERT INTO `lugar` VALUES (3,'Dietética Tomy Urquiza','comercio',-34.57088000,-58.48834000,'Av. Olazábal 5110, CABA',1,'2026-07-28 00:24:16');
INSERT INTO `lugar` VALUES (4,'Ferretería La Nueva','comercio',-34.57450000,-58.49120000,'Av. Monroe 5302, CABA',1,'2026-07-28 00:24:16');
INSERT INTO `lugar` VALUES (5,'Supermercado Coto Sucursal 65','comercio',-34.57580000,-58.48150000,'Av. Monroe 4751, CABA',1,'2026-07-28 00:24:16');
INSERT INTO `lugar` VALUES (6,'Panadería y Confitería La Nueva San José','comercio',-34.56890000,-58.49050000,'Av. Triunvirato 4502, CABA',1,'2026-07-28 00:24:16');
INSERT INTO `lugar` VALUES (7,'Fiambrería y Quesería Al Queso, Queso','comercio',-34.57310000,-58.48520000,'Echeverría 5012, CABA',1,'2026-07-28 00:24:16');
INSERT INTO `lugar` VALUES (8,'Pet Shop Paws Villa Urquiza','comercio',-34.57020000,-58.49210000,'Av. Olazábal 5390, CABA',1,'2026-07-28 00:24:16');
INSERT INTO `lugar` VALUES (9,'Hospital General de Agudos Dr. Pini','hospital',-34.57280000,-58.47350000,'Av. Combatientes de Malvinas 3002, CABA',1,'2026-07-28 00:24:16');
INSERT INTO `lugar` VALUES (10,'Cemic Sede Saavedra/Urquiza','hospital',-34.56310000,-58.49190000,'Av. Galván 4102, CABA',1,'2026-07-28 00:24:16');
INSERT INTO `lugar` VALUES (11,'Centro Médico Villa Urquiza - Swiss Medical','hospital',-34.57350000,-58.48410000,'Av. Olazábal 4820, CABA',1,'2026-07-28 00:24:16');
INSERT INTO `lugar` VALUES (12,'Sanatorio Colegiales - Consultorios Urquiza','hospital',-34.57190000,-58.48890000,'Blanco Encalada 5051, CABA',1,'2026-07-28 00:24:16');
INSERT INTO `lugar` VALUES (13,'Centro de Salud y Acción Comunitaria (CeSAC) N° 12','hospital',-34.57910000,-58.48100000,'Olazábal 3960, CABA',1,'2026-07-28 00:24:16');
INSERT INTO `lugar` VALUES (14,'Clínica De Los Virreyes','hospital',-34.56580000,-58.47410000,'Av. de los Constituyentes 3400, CABA',1,'2026-07-28 00:24:16');
INSERT INTO `lugar` VALUES (15,'Centro Pediátrico Urquiza','hospital',-34.57510000,-58.48620000,'Av. Monroe 4980, CABA',1,'2026-07-28 00:24:16');
INSERT INTO `lugar` VALUES (16,'Banco Galicia Sucursal Villa Urquiza','banco',-34.57260000,-58.48540000,'Av. Triunvirato 4650, CABA',1,'2026-07-28 01:05:40');
INSERT INTO `lugar` VALUES (17,'Banco Santander Sucursal Urquiza','banco',-34.57330000,-58.48280000,'Av. Triunvirato 4310, CABA',1,'2026-07-28 01:05:40');
INSERT INTO `lugar` VALUES (18,'Banco Provincia Sucursal Villa Urquiza','banco',-34.57620000,-58.48720000,'Av. Monroe 4380, CABA',1,'2026-07-28 01:05:40');
INSERT INTO `lugar` VALUES (19,'Restaurante Manolo Villa Urquiza','restaurante',-34.57180000,-58.48610000,'Av. Triunvirato 4520, CABA',1,'2026-07-28 01:05:40');
INSERT INTO `lugar` VALUES (20,'Pizzería El Aljibe','restaurante',-34.57540000,-58.48610000,'Av. Monroe 4650, CABA',1,'2026-07-28 01:05:40');
INSERT INTO `lugar` VALUES (21,'Parrilla La Estancia Urquiza','restaurante',-34.57050000,-58.48950000,'Av. Olazábal 4200, CABA',1,'2026-07-28 01:05:40');
INSERT INTO `lugar` VALUES (22,'Estación Villa Urquiza (Ferrocarril Urquiza)','transporte',-34.57460000,-58.48370000,'Av. Triunvirato y Beláustegui, CABA',1,'2026-07-28 01:05:40');
INSERT INTO `lugar` VALUES (23,'Estación Juan Manuel de Rosas (Subte Línea B)','transporte',-34.57180000,-58.48380000,'Av. Triunvirato 4700, CABA',1,'2026-07-28 01:05:40');
INSERT INTO `lugar` VALUES (24,'Parada Metrobus Av. Congreso','transporte',-34.56920000,-58.48260000,'Av. Congreso 4400, CABA',1,'2026-07-28 01:05:40');
INSERT INTO `lugar` VALUES (25,'CGP Comuna 12','oficina_publica',-34.57390000,-58.48200000,'Av. Congreso 4055, CABA',1,'2026-07-28 01:05:40');
INSERT INTO `lugar` VALUES (26,'Correo Argentino Sucursal Villa Urquiza','oficina_publica',-34.57230000,-58.48790000,'Av. Triunvirato 4750, CABA',1,'2026-07-28 01:05:40');
INSERT INTO `lugar` VALUES (27,'ANSES UDAI Villa Urquiza','oficina_publica',-34.57610000,-58.48520000,'Av. Triunvirato 4900, CABA',1,'2026-07-28 01:05:40');
