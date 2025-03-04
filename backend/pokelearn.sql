DROP DATABASE IF EXISTS pokelearn;
CREATE DATABASE pokelearn;
USE pokelearn;

CREATE TABLE `user` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_name` VARCHAR(255) NOT NULL UNIQUE,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `profile_picture` VARCHAR(255),
    `last_login` DATETIME
);

CREATE TABLE `team` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
);

CREATE TABLE `pokemon` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `num_pokedex` INT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `nameId` VARCHAR(255) NOT NULL,
    `height` DECIMAL(10,1) NOT NULL,
    `weight` DECIMAL(10,1) NOT NULL,
    `sprite_small_url` VARCHAR(255) NULL,
    `sprite_default_url` VARCHAR(255) NULL,
    `sprite_gif_url` VARCHAR(255) NULL,
    `audio` VARCHAR(255) NULL,
    `base_hp` TINYINT UNSIGNED NOT NULL,
    `base_atk` TINYINT UNSIGNED NOT NULL,
    `base_def` TINYINT UNSIGNED NOT NULL,
    `base_spatk` TINYINT UNSIGNED NOT NULL,
    `base_spdef` TINYINT UNSIGNED NOT NULL,
    `base_speed` TINYINT UNSIGNED NOT NULL
);

CREATE TABLE `type` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE `pokemonType` (
    `pokemon_id` INT UNSIGNED NOT NULL,
    `type_id` INT UNSIGNED NOT NULL,
    `order` TINYINT UNSIGNED NOT NULL CHECK (`order` IN (1, 2)),
    PRIMARY KEY (`pokemon_id`, `order`),
    UNIQUE (`pokemon_id`, `type_id`),
    FOREIGN KEY (`pokemon_id`) REFERENCES `pokemon`(`id`),
    FOREIGN KEY (`type_id`) REFERENCES `type`(`id`)
);

CREATE TABLE `ability` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `nameId` VARCHAR(255) NOT NULL UNIQUE,
    `description` TEXT NOT NULL
);

CREATE TABLE `pokemonAbility` (
    `pokemon_id` INT UNSIGNED NOT NULL,
    `ability_id` INT UNSIGNED NOT NULL,
    `is_hidden` BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (`pokemon_id`, `ability_id`),
    FOREIGN KEY (`pokemon_id`) REFERENCES `pokemon`(`id`),
    FOREIGN KEY (`ability_id`) REFERENCES `ability`(`id`)
);

CREATE TABLE `move` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `nameId` VARCHAR(255) NOT NULL UNIQUE,
    `type_id` INT UNSIGNED NOT NULL,
    `power` INT,
    `accuracy` INT,
    `pp` TINYINT UNSIGNED NOT NULL,
    `category` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `short_description` TEXT NOT NULL,
    `target` VARCHAR(255) NOT NULL,
    `priority` INT NOT NULL,
    FOREIGN KEY (`type_id`) REFERENCES `type`(`id`)
);

CREATE TABLE `pokemonMove` (
    `pokemon_id` INT UNSIGNED NOT NULL,
    `move_id` INT UNSIGNED NOT NULL,
    PRIMARY KEY (`pokemon_id`, `move_id`),
    FOREIGN KEY (`pokemon_id`) REFERENCES `pokemon`(`id`),
    FOREIGN KEY (`move_id`) REFERENCES `move`(`id`)
);

CREATE TABLE `item` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `description` TEXT NOT NULL,
    `sprite_num` INT UNSIGNED NOT NULL
);

CREATE TABLE `teamPokemon` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `pokemon_id` INT UNSIGNED NOT NULL,
    `team_id` INT UNSIGNED NOT NULL,
    `level` TINYINT UNSIGNED NOT NULL DEFAULT 100,
    `ability_id` INT UNSIGNED NOT NULL,
    `item_id` INT UNSIGNED,
    `ev_hp` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `ev_atk` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `ev_def` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `ev_spatk` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `ev_spdef` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `ev_speed` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `iv_hp` TINYINT UNSIGNED NOT NULL DEFAULT 31,
    `iv_atk` TINYINT UNSIGNED NOT NULL DEFAULT 31,
    `iv_def` TINYINT UNSIGNED NOT NULL DEFAULT 31,
    `iv_spatk` TINYINT UNSIGNED NOT NULL DEFAULT 31,
    `iv_spdef` TINYINT UNSIGNED NOT NULL DEFAULT 31,
    `iv_speed` TINYINT UNSIGNED NOT NULL DEFAULT 31,
    FOREIGN KEY (`pokemon_id`) REFERENCES `pokemon`(`id`),
    FOREIGN KEY (`team_id`) REFERENCES `team`(`id`),
    FOREIGN KEY (`ability_id`) REFERENCES `ability`(`id`),
    FOREIGN KEY (`item_id`) REFERENCES `item`(`id`)
);

CREATE TABLE `type_effectiveness` (
    `attacker_type_id` INT UNSIGNED NOT NULL,
    `defender_type_id` INT UNSIGNED NOT NULL,
    `multiplier` DECIMAL(3,1) NOT NULL,
    PRIMARY KEY (`attacker_type_id`, `defender_type_id`),
    FOREIGN KEY (`attacker_type_id`) REFERENCES `type`(`id`),
    FOREIGN KEY (`defender_type_id`) REFERENCES `type`(`id`)
);