require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const initDB = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        console.log(`Banco de dados '${process.env.DB_NAME}' garantido.`);

        await connection.end(); // Fecha a conexão antes de abrir outra

        return mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    } catch (error) {
        console.error("Erro ao conectar ao MySQL:", error);
        process.exit(1); // Sai do processo se houver falha na conexão
    }
};

let db;
initDB().then(pool => {
    db = pool;

    db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE
        )
    `).then(() => console.log("Tabela 'users' garantida."))
    .catch(err => console.error("Erro ao criar tabela:", err));
});

// Criar usuário
app.post('/users', async (req, res) => {
    const { name, email } = req.body;
    
    if (!name || !email) return res.status(400).json({ error: "Nome e email são obrigatórios!" });

    try {
        const [results] = await db.query(`INSERT INTO users (name, email) VALUES (?, ?)`, [name, email]);
        res.json({ message: 'Usuário criado com sucesso', id: results.insertId });
    } catch (err) {
        res.status(500).json({ error: err.code === 'ER_DUP_ENTRY' ? 'Email já cadastrado!' : err.message });
    }
});

// Obter todos os usuários
app.get('/users', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM users');
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
