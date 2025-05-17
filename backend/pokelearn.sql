DROP DATABASE IF EXISTS pokelearn;
CREATE DATABASE pokelearn;
USE pokelearn;

-- Tabla de usuarios
CREATE TABLE `user` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_name` VARCHAR(255) NOT NULL UNIQUE,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `profile_picture` VARCHAR(255) DEFAULT NULL,
    `firebase_uid` VARCHAR(128) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_login` DATETIME
);

-- Tabla de equipos
CREATE TABLE `team` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

-- Tabla principal de Pokémon en equipos
CREATE TABLE `team_pokemon` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `team_id` INT UNSIGNED NOT NULL,
    `pokemon_name` VARCHAR(255),
    `pokemon_id` VARCHAR(255),
    `image` VARCHAR(255) DEFAULT NULL,
    `level` TINYINT UNSIGNED DEFAULT 100,
    `nature` VARCHAR(50) DEFAULT 'Hardy',
    `slot` TINYINT UNSIGNED NOT NULL,
    FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON DELETE CASCADE
);

-- Tabla de EVs (Effort Values)
CREATE TABLE `pokemon_evs` (
    `team_pokemon_id` INT UNSIGNED NOT NULL PRIMARY KEY,
    `hp` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `atk` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `def` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `spatk` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `spdef` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `speed` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    FOREIGN KEY (`team_pokemon_id`) REFERENCES `team_pokemon`(`id`) ON DELETE CASCADE
);

-- Tabla de IVs (Individual Values)
CREATE TABLE `pokemon_ivs` (
    `team_pokemon_id` INT UNSIGNED NOT NULL PRIMARY KEY,
    `hp` TINYINT UNSIGNED NOT NULL DEFAULT 31,
    `atk` TINYINT UNSIGNED NOT NULL DEFAULT 31,
    `def` TINYINT UNSIGNED NOT NULL DEFAULT 31,
    `spatk` TINYINT UNSIGNED NOT NULL DEFAULT 31,
    `spdef` TINYINT UNSIGNED NOT NULL DEFAULT 31,
    `speed` TINYINT UNSIGNED NOT NULL DEFAULT 31,
    FOREIGN KEY (`team_pokemon_id`) REFERENCES `team_pokemon`(`id`) ON DELETE CASCADE
);

-- Tabla para estadísticas calculadas (Modificada)
CREATE TABLE `pokemon_stats` (
    `team_pokemon_id` INT UNSIGNED NOT NULL,
    `hp` SMALLINT UNSIGNED DEFAULT 0,
    `atk` SMALLINT UNSIGNED DEFAULT 0,
    `def` SMALLINT UNSIGNED DEFAULT 0,
    `spatk` SMALLINT UNSIGNED DEFAULT 0,
    `spdef` SMALLINT UNSIGNED DEFAULT 0,
    `speed` SMALLINT UNSIGNED DEFAULT 0,
    PRIMARY KEY (`team_pokemon_id`),
    FOREIGN KEY (`team_pokemon_id`) REFERENCES `team_pokemon`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla para movimientos de los pokemon (modificada para guardar solo ID)
CREATE TABLE `pokemon_moves` (
    `team_pokemon_id` INT UNSIGNED NOT NULL,
    `move_slot` TINYINT UNSIGNED NOT NULL CHECK (`move_slot` BETWEEN 1 AND 4),
    `move_id` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`team_pokemon_id`, `move_slot`),
    FOREIGN KEY (`team_pokemon_id`) REFERENCES `team_pokemon`(`id`) ON DELETE CASCADE
);

-- Tabla para items y abilities (eliminado ability_type)
CREATE TABLE `pokemon_build` (
    `team_pokemon_id` INT UNSIGNED NOT NULL PRIMARY KEY,
    `item_id` VARCHAR(255) DEFAULT NULL,
    `ability_id` VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (`team_pokemon_id`) REFERENCES `team_pokemon`(`id`) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX `idx_team_user_id` ON `team` (`user_id`);
CREATE INDEX `idx_team_pokemon_team_id` ON `team_pokemon` (`team_id`);