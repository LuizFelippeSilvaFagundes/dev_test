USE test_db;

-- Crie a tabela de user
CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL
);

-- Crie a tabela de post
CREATE TABLE IF NOT EXISTS post (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    userId INT NOT NULL,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE ON UPDATE CASCADE
);
