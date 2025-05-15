CREATE DATABASE tetris_game;

USE tetris_game;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,  -- рекомендуется хранить хеш пароля, а не текст
    score1 INT DEFAULT 0,
    score2 INT DEFAULT 0
);