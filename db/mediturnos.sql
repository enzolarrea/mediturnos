-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 26-11-2025 a las 21:19:21
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `mediturnos`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `obtener_horarios_disponibles` (IN `p_medico_id` INT UNSIGNED, IN `p_fecha` DATE)   BEGIN
    DECLARE v_dia_semana VARCHAR(20);
    DECLARE v_hora_inicio TIME;
    DECLARE v_hora_fin TIME;
    
    -- Obtener día de la semana y horario disponible
    SELECT dia_semana, hora_inicio, hora_fin
    INTO v_dia_semana, v_hora_inicio, v_hora_fin
    FROM medico_disponibilidad
    WHERE medico_id = p_medico_id
      AND dia_semana = LOWER(DAYNAME(p_fecha))
      AND activo = TRUE
    LIMIT 1;
    
    -- Si hay disponibilidad, mostrar horarios disponibles
    IF v_hora_inicio IS NOT NULL THEN
        SELECT TIME_FORMAT(hora, '%H:%i') AS hora_disponible
        FROM (
            SELECT '08:00' AS hora UNION SELECT '08:30' UNION SELECT '09:00' UNION SELECT '09:30' UNION
            SELECT '10:00' UNION SELECT '10:30' UNION SELECT '11:00' UNION SELECT '11:30' UNION
            SELECT '12:00' UNION SELECT '12:30' UNION SELECT '13:00' UNION SELECT '13:30' UNION
            SELECT '14:00' UNION SELECT '14:30' UNION SELECT '15:00' UNION SELECT '15:30' UNION
            SELECT '16:00' UNION SELECT '16:30' UNION SELECT '17:00' UNION SELECT '17:30' UNION
            SELECT '18:00'
        ) AS horarios
        WHERE hora BETWEEN v_hora_inicio AND v_hora_fin
          AND NOT EXISTS (
              SELECT 1 FROM turnos t
              INNER JOIN turno_estados te ON t.estado_id = te.id
              WHERE t.medico_id = p_medico_id
                AND t.fecha = p_fecha
                AND t.hora = horarios.hora
                AND te.codigo NOT IN ('cancelado', 'no_asistio')
          )
        ORDER BY hora;
    ELSE
        SELECT 'No hay disponibilidad para este día' AS mensaje;
    END IF;
END$$

--
-- Funciones
--
CREATE DEFINER=`root`@`localhost` FUNCTION `verificar_disponibilidad_medico` (`p_medico_id` INT UNSIGNED, `p_fecha` DATE, `p_hora` TIME) RETURNS TINYINT(1) DETERMINISTIC READS SQL DATA BEGIN
    DECLARE v_dia_semana VARCHAR(20);
    DECLARE v_disponible BOOLEAN DEFAULT FALSE;
    DECLARE v_turno_existente INT DEFAULT 0;
    
    -- Obtener día de la semana
    SET v_dia_semana = LOWER(DAYNAME(p_fecha));
    
    -- Verificar si el médico tiene disponibilidad en ese día
    SELECT COUNT(*) > 0 INTO v_disponible
    FROM medico_disponibilidad
    WHERE medico_id = p_medico_id
      AND dia_semana = v_dia_semana
      AND activo = TRUE
      AND p_hora BETWEEN hora_inicio AND hora_fin;
    
    -- Verificar si ya existe un turno activo en esa fecha/hora
    IF v_disponible THEN
        SELECT COUNT(*) INTO v_turno_existente
        FROM turnos t
        INNER JOIN turno_estados te ON t.estado_id = te.id
        WHERE t.medico_id = p_medico_id
          AND t.fecha = p_fecha
          AND t.hora = p_hora
          AND te.codigo NOT IN ('cancelado', 'no_asistio');
        
        IF v_turno_existente > 0 THEN
            SET v_disponible = FALSE;
        END IF;
    END IF;
    
    RETURN v_disponible;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `especialidades`
--

CREATE TABLE `especialidades` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `especialidades`
--

INSERT INTO `especialidades` (`id`, `nombre`, `descripcion`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Cardiología', 'Especialidad médica que se encarga del corazón y el sistema circulatorio', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(2, 'Dermatología', 'Especialidad médica que se encarga de la piel, el cabello y las uñas', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(3, 'Pediatría', 'Especialidad médica que se encarga de la salud de bebés, niños y adolescentes', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(4, 'Neurología', 'Especialidad médica que se encarga del sistema nervioso', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(5, 'Oftalmología', 'Especialidad médica que se encarga de los ojos y la visión', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(6, 'Traumatología', 'Especialidad médica que se encarga del sistema musculoesquelético', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `medicos`
--

CREATE TABLE `medicos` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `matricula` varchar(50) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `horario` varchar(100) DEFAULT NULL COMMENT 'Horario general en formato texto (ej: "08:00 - 17:00")',
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `creado_por` int(10) UNSIGNED DEFAULT NULL,
  `actualizado_por` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `medicos`
--

INSERT INTO `medicos` (`id`, `nombre`, `matricula`, `email`, `telefono`, `horario`, `activo`, `fecha_creacion`, `fecha_actualizacion`, `creado_por`, `actualizado_por`) VALUES
(1, 'Dr. Carlos López', '12345', 'carlos.lopez@mediturnos.com', '(011) 1234-5678', '08:00 - 17:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39', NULL, NULL),
(2, 'Dra. Ana Martínez', '23456', 'ana.martinez@mediturnos.com', '(011) 2345-6789', '09:00 - 18:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39', NULL, NULL),
(3, 'Dr. Luis García', '34567', 'luis.garcia@mediturnos.com', '(011) 3456-7890', '08:30 - 16:30', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `medico_disponibilidad`
--

CREATE TABLE `medico_disponibilidad` (
  `id` int(10) UNSIGNED NOT NULL,
  `medico_id` int(10) UNSIGNED NOT NULL,
  `dia_semana` enum('lunes','martes','miercoles','jueves','viernes','sabado','domingo') NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Volcado de datos para la tabla `medico_disponibilidad`
--

INSERT INTO `medico_disponibilidad` (`id`, `medico_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 1, 'lunes', '08:00:00', '17:00:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(2, 1, 'martes', '08:00:00', '17:00:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(3, 1, 'miercoles', '08:00:00', '17:00:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(4, 1, 'jueves', '08:00:00', '17:00:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(5, 1, 'viernes', '08:00:00', '17:00:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(6, 2, 'lunes', '09:00:00', '18:00:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(7, 2, 'martes', '09:00:00', '18:00:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(8, 2, 'miercoles', '09:00:00', '18:00:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(9, 2, 'jueves', '09:00:00', '18:00:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(10, 2, 'viernes', '09:00:00', '18:00:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(11, 3, 'lunes', '08:30:00', '16:30:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(12, 3, 'martes', '08:30:00', '16:30:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(13, 3, 'miercoles', '08:30:00', '16:30:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(14, 3, 'jueves', '08:30:00', '16:30:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(15, 3, 'viernes', '08:30:00', '16:30:00', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `medico_especialidades`
--

CREATE TABLE `medico_especialidades` (
  `id` int(10) UNSIGNED NOT NULL,
  `medico_id` int(10) UNSIGNED NOT NULL,
  `especialidad_id` int(10) UNSIGNED NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `medico_especialidades`
--

INSERT INTO `medico_especialidades` (`id`, `medico_id`, `especialidad_id`, `fecha_creacion`) VALUES
(1, 1, 1, '2025-11-24 00:49:39'),
(2, 2, 2, '2025-11-24 00:49:39'),
(3, 3, 3, '2025-11-24 00:49:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id` int(10) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL,
  `mensaje` text NOT NULL,
  `tipo` enum('info','success','warning','error') NOT NULL DEFAULT 'info',
  `leida` tinyint(1) DEFAULT 0,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_lectura` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `notificaciones`
--

INSERT INTO `notificaciones` (`id`, `usuario_id`, `mensaje`, `tipo`, `leida`, `fecha`, `fecha_lectura`) VALUES
(1, 4, 'Su turno del 24/11/2025 a las 09:00 ha sido confirmado', 'success', 0, '2025-11-24 00:49:39', NULL),
(2, 3, 'Tiene un nuevo turno pendiente para el 24/11/2025', 'info', 0, '2025-11-24 00:49:39', NULL),
(3, 2, 'Hay 2 turnos pendientes de confirmación', 'warning', 0, '2025-11-24 00:49:39', NULL),
(4, 1, 'Bienvenido al sistema MediTurnos', 'info', 1, '2025-11-23 00:49:39', NULL),
(6, 4, 'Se ha creado un turno para el 30/11/2025 a las 12:30', 'info', 0, '2025-11-24 13:44:37', NULL),
(8, 8, 'Se ha creado un turno para el 29/11/2025 a las 13:30', 'info', 0, '2025-11-26 19:25:10', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pacientes`
--

CREATE TABLE `pacientes` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `dni` varchar(20) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `ultima_visita` date DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `creado_por` int(10) UNSIGNED DEFAULT NULL,
  `actualizado_por` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `pacientes`
--

INSERT INTO `pacientes` (`id`, `nombre`, `apellido`, `dni`, `telefono`, `email`, `fecha_nacimiento`, `direccion`, `ultima_visita`, `activo`, `fecha_creacion`, `fecha_actualizacion`, `creado_por`, `actualizado_por`) VALUES
(1, 'Juan', 'Pérez', '12.345.678', '(011) 1111-2222', 'juan.perez@email.com', '1985-05-15', 'Av. Corrientes 1234', '2025-11-24', 1, '2025-11-24 00:49:39', '2025-11-26 04:43:31', NULL, NULL),
(2, 'María', 'González', '23.456.789', '(011) 2222-3333', 'maria.gonzalez@email.com', '1990-08-20', 'Av. Santa Fe 5678', '2025-11-23', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39', NULL, NULL),
(3, 'Carlos', 'Ruiz', '34.567.890', '(011) 3333-4444', 'carlos.ruiz@email.com', '1988-12-10', 'Av. Córdoba 9012', '2025-11-23', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39', NULL, NULL),
(7, 'Enzo', 'Larrea', '45812374', '', 'enzolarrea7@gmail.com', '2004-05-02', '', NULL, 1, '2025-11-26 19:24:20', '2025-11-26 19:24:20', 1, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `turnos`
--

CREATE TABLE `turnos` (
  `id` int(10) UNSIGNED NOT NULL,
  `paciente_id` int(10) UNSIGNED NOT NULL,
  `medico_id` int(10) UNSIGNED NOT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `estado_id` int(10) UNSIGNED NOT NULL DEFAULT 1 COMMENT 'FK a turno_estados',
  `motivo` text DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `creado_por` int(10) UNSIGNED DEFAULT NULL,
  `actualizado_por` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `turnos`
--

INSERT INTO `turnos` (`id`, `paciente_id`, `medico_id`, `fecha`, `hora`, `estado_id`, `motivo`, `notas`, `fecha_creacion`, `fecha_actualizacion`, `creado_por`, `actualizado_por`) VALUES
(1, 1, 1, '2025-11-24', '09:00:00', 4, 'Control de presión arterial', 'Seguimiento post-operatorio', '2025-11-24 00:49:39', '2025-11-26 04:43:57', 4, 3),
(2, 2, 1, '2025-11-24', '10:30:00', 1, 'Consulta general', NULL, '2025-11-24 00:49:39', '2025-11-24 00:49:39', 2, NULL),
(3, 3, 1, '2025-11-25', '11:00:00', 2, 'Electrocardiograma', 'Seguimiento post-operatorio', '2025-11-24 00:49:39', '2025-11-24 00:49:39', 2, NULL),
(4, 1, 2, '2025-11-26', '10:00:00', 2, 'Revisión de lunares', 'Control anual', '2025-11-24 00:49:39', '2025-11-24 00:49:39', 4, NULL),
(5, 2, 2, '2025-11-26', '14:00:00', 1, 'Dermatitis', 'Primera consulta', '2025-11-24 00:49:39', '2025-11-24 00:49:39', 2, NULL),
(6, 3, 3, '2025-11-27', '09:30:00', 2, 'Control pediátrico', 'Vacunación pendiente', '2025-11-24 00:49:39', '2025-11-24 00:49:39', 2, NULL),
(7, 1, 3, '2025-11-28', '11:30:00', 1, 'Consulta general', NULL, '2025-11-24 00:49:39', '2025-11-24 00:49:39', 2, NULL),
(8, 1, 1, '2025-11-16', '09:00:00', 4, 'Control de presión arterial', 'Presión normal, continuar con medicación', '2025-11-17 00:49:39', '2025-11-24 00:49:39', 2, NULL),
(9, 2, 2, '2025-11-18', '10:00:00', 4, 'Revisión de piel', 'Todo normal, próxima consulta en 6 meses', '2025-11-19 00:49:39', '2025-11-24 00:49:39', 2, NULL),
(10, 3, 3, '2025-11-20', '09:30:00', 4, 'Control de crecimiento', 'Peso y talla dentro de parámetros normales', '2025-11-21 00:49:39', '2025-11-24 00:49:39', 2, NULL),
(16, 7, 1, '2025-11-29', '13:30:00', 1, 'Testing...', '', '2025-11-26 19:25:10', '2025-11-26 19:25:10', 1, NULL);

--
-- Disparadores `turnos`
--
DELIMITER $$
CREATE TRIGGER `trg_actualizar_ultima_visita` AFTER UPDATE ON `turnos` FOR EACH ROW BEGIN
    -- Si el estado cambió a 'completado', actualizar última visita del paciente
    IF NEW.estado_id != OLD.estado_id THEN
        SET @estado_completado = (SELECT id FROM turno_estados WHERE codigo = 'completado');
        
        IF NEW.estado_id = @estado_completado THEN
            UPDATE pacientes
            SET ultima_visita = NEW.fecha,
                fecha_actualizacion = NOW()
            WHERE id = NEW.paciente_id;
        END IF;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_notificar_turno_confirmado` AFTER UPDATE ON `turnos` FOR EACH ROW BEGIN
    DECLARE v_paciente_usuario_id INT;
    DECLARE v_medico_usuario_id INT;
    DECLARE v_estado_confirmado INT;
    DECLARE v_estado_anterior INT;
    
    -- Obtener ID del estado confirmado
    SELECT id INTO v_estado_confirmado FROM turno_estados WHERE codigo = 'confirmado';
    
    -- Solo si cambió a confirmado
    IF NEW.estado_id = v_estado_confirmado AND OLD.estado_id != v_estado_confirmado THEN
        -- Notificar al paciente
        SELECT id INTO v_paciente_usuario_id
        FROM usuarios
        WHERE paciente_id = NEW.paciente_id
        LIMIT 1;
        
        IF v_paciente_usuario_id IS NOT NULL THEN
            INSERT INTO notificaciones (usuario_id, mensaje, tipo, leida, fecha)
            VALUES (
                v_paciente_usuario_id,
                CONCAT('Su turno del ', DATE_FORMAT(NEW.fecha, '%d/%m/%Y'), ' a las ', TIME_FORMAT(NEW.hora, '%H:%i'), ' ha sido confirmado'),
                'success',
                FALSE,
                NOW()
            );
        END IF;
        
        -- Notificar al médico
        SELECT id INTO v_medico_usuario_id
        FROM usuarios
        WHERE medico_id = NEW.medico_id
        LIMIT 1;
        
        IF v_medico_usuario_id IS NOT NULL THEN
            INSERT INTO notificaciones (usuario_id, mensaje, tipo, leida, fecha)
            VALUES (
                v_medico_usuario_id,
                CONCAT('Tiene un turno confirmado para el ', DATE_FORMAT(NEW.fecha, '%d/%m/%Y'), ' a las ', TIME_FORMAT(NEW.hora, '%H:%i')),
                'info',
                FALSE,
                NOW()
            );
        END IF;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_notificar_turno_creado` AFTER INSERT ON `turnos` FOR EACH ROW BEGIN
    DECLARE v_paciente_usuario_id INT;
    
    -- Buscar el usuario asociado al paciente
    SELECT id INTO v_paciente_usuario_id
    FROM usuarios
    WHERE paciente_id = NEW.paciente_id
    LIMIT 1;
    
    -- Si existe un usuario para este paciente, crear notificación
    IF v_paciente_usuario_id IS NOT NULL THEN
        INSERT INTO notificaciones (usuario_id, mensaje, tipo, leida, fecha)
        VALUES (
            v_paciente_usuario_id,
            CONCAT('Se ha creado un turno para el ', DATE_FORMAT(NEW.fecha, '%d/%m/%Y'), ' a las ', TIME_FORMAT(NEW.hora, '%H:%i')),
            'info',
            FALSE,
            NOW()
        );
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_validar_turno_antes_insert` BEFORE INSERT ON `turnos` FOR EACH ROW BEGIN
    DECLARE v_conflicto INT DEFAULT 0;
    DECLARE v_estado_cancelado INT;
    DECLARE v_estado_no_asistio INT;
    
    -- Obtener IDs de estados que no bloquean
    SELECT id INTO v_estado_cancelado FROM turno_estados WHERE codigo = 'cancelado';
    SELECT id INTO v_estado_no_asistio FROM turno_estados WHERE codigo = 'no_asistio';
    
    -- Verificar si existe un turno activo en la misma fecha/hora
    SELECT COUNT(*) INTO v_conflicto
    FROM turnos
    WHERE medico_id = NEW.medico_id
      AND fecha = NEW.fecha
      AND hora = NEW.hora
      AND estado_id NOT IN (v_estado_cancelado, v_estado_no_asistio)
      AND id != NEW.id;
    
    IF v_conflicto > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El médico ya tiene un turno activo en esta fecha y hora';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_validar_turno_antes_update` BEFORE UPDATE ON `turnos` FOR EACH ROW BEGIN
    DECLARE v_conflicto INT DEFAULT 0;
    DECLARE v_estado_cancelado INT;
    DECLARE v_estado_no_asistio INT;
    
    -- Solo validar si cambió fecha, hora o médico
    IF (NEW.fecha != OLD.fecha OR NEW.hora != OLD.hora OR NEW.medico_id != OLD.medico_id) THEN
        -- Obtener IDs de estados que no bloquean
        SELECT id INTO v_estado_cancelado FROM turno_estados WHERE codigo = 'cancelado';
        SELECT id INTO v_estado_no_asistio FROM turno_estados WHERE codigo = 'no_asistio';
        
        -- Verificar si existe un turno activo en la nueva fecha/hora
        SELECT COUNT(*) INTO v_conflicto
        FROM turnos
        WHERE medico_id = NEW.medico_id
          AND fecha = NEW.fecha
          AND hora = NEW.hora
          AND estado_id NOT IN (v_estado_cancelado, v_estado_no_asistio)
          AND id != NEW.id;
        
        IF v_conflicto > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El médico ya tiene un turno activo en esta fecha y hora';
        END IF;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `turno_estados`
--

CREATE TABLE `turno_estados` (
  `id` int(10) UNSIGNED NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `turno_estados`
--

INSERT INTO `turno_estados` (`id`, `codigo`, `nombre`, `descripcion`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'pendiente', 'Pendiente', 'Turno creado pero aún no confirmado', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(2, 'confirmado', 'Confirmado', 'Turno confirmado por el paciente o secretario', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(3, 'en_curso', 'En Curso', 'El paciente está siendo atendido', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(4, 'completado', 'Completado', 'Turno finalizado exitosamente', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(5, 'cancelado', 'Cancelado', 'Turno cancelado por el paciente o médico', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39'),
(6, 'no_asistio', 'No Asistió', 'El paciente no se presentó al turno', 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL COMMENT 'En producción debe estar hasheado',
  `rol` enum('administrador','secretario','medico','paciente') NOT NULL,
  `medico_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'FK a medicos si el rol es medico',
  `paciente_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'FK a pacientes si el rol es paciente',
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `creado_por` int(10) UNSIGNED DEFAULT NULL,
  `actualizado_por` int(10) UNSIGNED DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `email`, `password`, `rol`, `medico_id`, `paciente_id`, `activo`, `fecha_creacion`, `fecha_actualizacion`, `creado_por`, `actualizado_por`) VALUES
(1, 'Admin', 'Sistema', 'admin@mediturnos.com', 'Admin123', 'administrador', NULL, NULL, 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39', NULL, NULL),
(2, 'María', 'González', 'secretario@mediturnos.com', 'Secret123', 'secretario', NULL, NULL, 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39', NULL, NULL),
(3, 'Dr. Carlos', 'López', 'medico@mediturnos.com', 'Medico123', 'medico', 1, NULL, 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39', NULL, NULL),
(4, 'Juan', 'Pérez', 'paciente@mediturnos.com', 'Paciente123', 'paciente', NULL, 1, 1, '2025-11-24 00:49:39', '2025-11-24 00:49:39', NULL, NULL),
(8, 'Enzo', 'Larrea', 'enzolarrea7@gmail.com', 'Mediturnos2025', 'paciente', NULL, 7, 1, '2025-11-26 19:24:20', '2025-11-26 19:24:20', 1, NULL);

--
-- Disparadores `usuarios`
--
DELIMITER $$
CREATE TRIGGER `trg_validar_rol_usuario_insert` BEFORE INSERT ON `usuarios` FOR EACH ROW BEGIN
    -- Reglas:
    -- 1) Rol médico debe tener medico_id
    IF NEW.rol = 'medico' AND NEW.medico_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Un usuario con rol médico debe tener un medico_id asociado';
    END IF;
    
    -- 2) Rol paciente debe tener paciente_id
    IF NEW.rol = 'paciente' AND NEW.paciente_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Un usuario con rol paciente debe tener un paciente_id asociado';
    END IF;
    
    -- 3) Roles administrador/secretario pueden insertarse libremente.
    --    Si vienen con medico_id o paciente_id, se los limpia para evitar inconsistencias,
    --    pero NO se bloquea la operación.
    IF NEW.rol IN ('administrador', 'secretario') THEN
        SET NEW.medico_id = NULL;
        SET NEW.paciente_id = NULL;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_validar_rol_usuario_update` BEFORE UPDATE ON `usuarios` FOR EACH ROW BEGIN
    -- Reglas:
    -- 1) Rol médico debe tener medico_id
    IF NEW.rol = 'medico' AND NEW.medico_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Un usuario con rol médico debe tener un medico_id asociado';
    END IF;
    
    -- 2) Rol paciente debe tener paciente_id
    IF NEW.rol = 'paciente' AND NEW.paciente_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Un usuario con rol paciente debe tener un paciente_id asociado';
    END IF;
    
    -- 3) Al cambiar a administrador/secretario, se limpian medico_id y paciente_id
    --    para permitir el cambio de rol sin errores.
    IF NEW.rol IN ('administrador', 'secretario') THEN
        SET NEW.medico_id = NULL;
        SET NEW.paciente_id = NULL;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_disponibilidad_medicos`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_disponibilidad_medicos` (
`medico_id` int(10) unsigned
,`medico_nombre` varchar(200)
,`dia_semana` enum('lunes','martes','miercoles','jueves','viernes','sabado','domingo')
,`hora_inicio` time
,`hora_fin` time
,`horas_disponibles` decimal(20,4)
,`activo` tinyint(1)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_estadisticas_turnos`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_estadisticas_turnos` (
`medico_id` int(10) unsigned
,`medico_nombre` varchar(200)
,`total_turnos` bigint(21)
,`turnos_pendientes` decimal(22,0)
,`turnos_confirmados` decimal(22,0)
,`turnos_completados` decimal(22,0)
,`turnos_cancelados` decimal(22,0)
,`turnos_futuros` decimal(22,0)
,`turnos_pasados` decimal(22,0)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_medicos_completos`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_medicos_completos` (
`id` int(10) unsigned
,`nombre` varchar(200)
,`matricula` varchar(50)
,`email` varchar(255)
,`telefono` varchar(50)
,`horario` varchar(100)
,`especialidades` mediumtext
,`cantidad_especialidades` bigint(21)
,`activo` tinyint(1)
,`fecha_creacion` timestamp
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_notificaciones_pendientes`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_notificaciones_pendientes` (
`id` int(10) unsigned
,`usuario_id` int(10) unsigned
,`usuario_nombre` varchar(201)
,`usuario_email` varchar(255)
,`mensaje` text
,`tipo` enum('info','success','warning','error')
,`fecha` timestamp
,`horas_desde_creacion` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_turnos_completos`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_turnos_completos` (
`id` int(10) unsigned
,`fecha` date
,`hora` time
,`paciente_nombre` varchar(201)
,`paciente_dni` varchar(20)
,`paciente_telefono` varchar(50)
,`paciente_email` varchar(255)
,`medico_id` int(10) unsigned
,`medico_nombre` varchar(200)
,`medico_matricula` varchar(50)
,`especialidades` mediumtext
,`estado_codigo` varchar(20)
,`estado_nombre` varchar(50)
,`motivo` text
,`notas` text
,`fecha_creacion` timestamp
,`fecha_actualizacion` timestamp
,`tipo_fecha` varchar(6)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `v_disponibilidad_medicos`
--
DROP TABLE IF EXISTS `v_disponibilidad_medicos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_disponibilidad_medicos`  AS SELECT `m`.`id` AS `medico_id`, `m`.`nombre` AS `medico_nombre`, `md`.`dia_semana` AS `dia_semana`, `md`.`hora_inicio` AS `hora_inicio`, `md`.`hora_fin` AS `hora_fin`, time_to_sec(timediff(`md`.`hora_fin`,`md`.`hora_inicio`)) / 3600 AS `horas_disponibles`, `md`.`activo` AS `activo` FROM (`medicos` `m` join `medico_disponibilidad` `md` on(`m`.`id` = `md`.`medico_id`)) WHERE `m`.`activo` = 1 AND `md`.`activo` = 1 ORDER BY `m`.`nombre` ASC, field(`md`.`dia_semana`,'lunes','martes','miercoles','jueves','viernes','sabado','domingo') ASC ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_estadisticas_turnos`
--
DROP TABLE IF EXISTS `v_estadisticas_turnos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_estadisticas_turnos`  AS SELECT `m`.`id` AS `medico_id`, `m`.`nombre` AS `medico_nombre`, count(`t`.`id`) AS `total_turnos`, sum(case when `te`.`codigo` = 'pendiente' then 1 else 0 end) AS `turnos_pendientes`, sum(case when `te`.`codigo` = 'confirmado' then 1 else 0 end) AS `turnos_confirmados`, sum(case when `te`.`codigo` = 'completado' then 1 else 0 end) AS `turnos_completados`, sum(case when `te`.`codigo` = 'cancelado' then 1 else 0 end) AS `turnos_cancelados`, sum(case when `t`.`fecha` >= curdate() then 1 else 0 end) AS `turnos_futuros`, sum(case when `t`.`fecha` < curdate() then 1 else 0 end) AS `turnos_pasados` FROM ((`medicos` `m` left join `turnos` `t` on(`m`.`id` = `t`.`medico_id`)) left join `turno_estados` `te` on(`t`.`estado_id` = `te`.`id`)) WHERE `m`.`activo` = 1 GROUP BY `m`.`id`, `m`.`nombre` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_medicos_completos`
--
DROP TABLE IF EXISTS `v_medicos_completos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_medicos_completos`  AS SELECT `m`.`id` AS `id`, `m`.`nombre` AS `nombre`, `m`.`matricula` AS `matricula`, `m`.`email` AS `email`, `m`.`telefono` AS `telefono`, `m`.`horario` AS `horario`, group_concat(`e`.`nombre` order by `e`.`nombre` ASC separator ', ') AS `especialidades`, count(distinct `me`.`especialidad_id`) AS `cantidad_especialidades`, `m`.`activo` AS `activo`, `m`.`fecha_creacion` AS `fecha_creacion` FROM ((`medicos` `m` left join `medico_especialidades` `me` on(`m`.`id` = `me`.`medico_id`)) left join `especialidades` `e` on(`me`.`especialidad_id` = `e`.`id`)) GROUP BY `m`.`id`, `m`.`nombre`, `m`.`matricula`, `m`.`email`, `m`.`telefono`, `m`.`horario`, `m`.`activo`, `m`.`fecha_creacion` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_notificaciones_pendientes`
--
DROP TABLE IF EXISTS `v_notificaciones_pendientes`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_notificaciones_pendientes`  AS SELECT `n`.`id` AS `id`, `n`.`usuario_id` AS `usuario_id`, concat(`u`.`nombre`,' ',`u`.`apellido`) AS `usuario_nombre`, `u`.`email` AS `usuario_email`, `n`.`mensaje` AS `mensaje`, `n`.`tipo` AS `tipo`, `n`.`fecha` AS `fecha`, timestampdiff(HOUR,`n`.`fecha`,current_timestamp()) AS `horas_desde_creacion` FROM (`notificaciones` `n` join `usuarios` `u` on(`n`.`usuario_id` = `u`.`id`)) WHERE `n`.`leida` = 0 ORDER BY `n`.`fecha` DESC ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_turnos_completos`
--
DROP TABLE IF EXISTS `v_turnos_completos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_turnos_completos`  AS SELECT `t`.`id` AS `id`, `t`.`fecha` AS `fecha`, `t`.`hora` AS `hora`, concat(`p`.`nombre`,' ',`p`.`apellido`) AS `paciente_nombre`, `p`.`dni` AS `paciente_dni`, `p`.`telefono` AS `paciente_telefono`, `p`.`email` AS `paciente_email`, `m`.`id` AS `medico_id`, `m`.`nombre` AS `medico_nombre`, `m`.`matricula` AS `medico_matricula`, group_concat(`e`.`nombre` separator ', ') AS `especialidades`, `te`.`codigo` AS `estado_codigo`, `te`.`nombre` AS `estado_nombre`, `t`.`motivo` AS `motivo`, `t`.`notas` AS `notas`, `t`.`fecha_creacion` AS `fecha_creacion`, `t`.`fecha_actualizacion` AS `fecha_actualizacion`, CASE WHEN `t`.`fecha` < curdate() THEN 'pasado' WHEN `t`.`fecha` = curdate() THEN 'hoy' ELSE 'futuro' END AS `tipo_fecha` FROM (((((`turnos` `t` join `pacientes` `p` on(`t`.`paciente_id` = `p`.`id`)) join `medicos` `m` on(`t`.`medico_id` = `m`.`id`)) join `turno_estados` `te` on(`t`.`estado_id` = `te`.`id`)) left join `medico_especialidades` `me` on(`m`.`id` = `me`.`medico_id`)) left join `especialidades` `e` on(`me`.`especialidad_id` = `e`.`id`)) WHERE `p`.`activo` = 1 AND `m`.`activo` = 1 GROUP BY `t`.`id`, `t`.`fecha`, `t`.`hora`, `p`.`nombre`, `p`.`apellido`, `p`.`dni`, `p`.`telefono`, `p`.`email`, `m`.`id`, `m`.`nombre`, `m`.`matricula`, `te`.`codigo`, `te`.`nombre`, `t`.`motivo`, `t`.`notas`, `t`.`fecha_creacion`, `t`.`fecha_actualizacion` ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `especialidades`
--
ALTER TABLE `especialidades`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`),
  ADD KEY `idx_activo` (`activo`);

--
-- Indices de la tabla `medicos`
--
ALTER TABLE `medicos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `matricula` (`matricula`),
  ADD KEY `idx_matricula` (`matricula`),
  ADD KEY `idx_activo` (`activo`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_nombre` (`nombre`);

--
-- Indices de la tabla `medico_disponibilidad`
--
ALTER TABLE `medico_disponibilidad`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_medico_dia` (`medico_id`,`dia_semana`),
  ADD KEY `idx_medico` (`medico_id`),
  ADD KEY `idx_dia_semana` (`dia_semana`),
  ADD KEY `idx_activo` (`activo`);

--
-- Indices de la tabla `medico_especialidades`
--
ALTER TABLE `medico_especialidades`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_medico_especialidad` (`medico_id`,`especialidad_id`),
  ADD KEY `idx_medico` (`medico_id`),
  ADD KEY `idx_especialidad` (`especialidad_id`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_usuario` (`usuario_id`),
  ADD KEY `idx_leida` (`leida`),
  ADD KEY `idx_fecha` (`fecha`),
  ADD KEY `idx_usuario_leida` (`usuario_id`,`leida`);

--
-- Indices de la tabla `pacientes`
--
ALTER TABLE `pacientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dni` (`dni`),
  ADD KEY `idx_dni` (`dni`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_activo` (`activo`),
  ADD KEY `idx_nombre_apellido` (`nombre`,`apellido`),
  ADD KEY `idx_ultima_visita` (`ultima_visita`);

--
-- Indices de la tabla `turnos`
--
ALTER TABLE `turnos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `creado_por` (`creado_por`),
  ADD KEY `actualizado_por` (`actualizado_por`),
  ADD KEY `idx_paciente` (`paciente_id`),
  ADD KEY `idx_medico` (`medico_id`),
  ADD KEY `idx_fecha` (`fecha`),
  ADD KEY `idx_fecha_hora` (`fecha`,`hora`),
  ADD KEY `idx_estado` (`estado_id`),
  ADD KEY `idx_medico_fecha_hora` (`medico_id`,`fecha`,`hora`);

--
-- Indices de la tabla `turno_estados`
--
ALTER TABLE `turno_estados`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `idx_codigo` (`codigo`),
  ADD KEY `idx_activo` (`activo`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_rol` (`rol`),
  ADD KEY `idx_activo` (`activo`),
  ADD KEY `idx_medico_id` (`medico_id`),
  ADD KEY `idx_paciente_id` (`paciente_id`),
  ADD KEY `idx_nombre_apellido` (`nombre`,`apellido`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `especialidades`
--
ALTER TABLE `especialidades`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `medicos`
--
ALTER TABLE `medicos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `medico_disponibilidad`
--
ALTER TABLE `medico_disponibilidad`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `medico_especialidades`
--
ALTER TABLE `medico_especialidades`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `pacientes`
--
ALTER TABLE `pacientes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `turnos`
--
ALTER TABLE `turnos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `turno_estados`
--
ALTER TABLE `turno_estados`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `medico_disponibilidad`
--
ALTER TABLE `medico_disponibilidad`
  ADD CONSTRAINT `medico_disponibilidad_ibfk_1` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `medico_especialidades`
--
ALTER TABLE `medico_especialidades`
  ADD CONSTRAINT `medico_especialidades_ibfk_1` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `medico_especialidades_ibfk_2` FOREIGN KEY (`especialidad_id`) REFERENCES `especialidades` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `turnos`
--
ALTER TABLE `turnos`
  ADD CONSTRAINT `turnos_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `turnos_ibfk_2` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `turnos_ibfk_3` FOREIGN KEY (`estado_id`) REFERENCES `turno_estados` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `turnos_ibfk_4` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `turnos_ibfk_5` FOREIGN KEY (`actualizado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `usuarios_ibfk_2` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
