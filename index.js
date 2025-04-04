require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

let connection;

  const initDB = async ()=>{

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`Banco de dados '${process.env.DB_NAME}' garantido.`);
  
    await connection.changeUser({ database: process.env.DB_NAME },);
      console.log('Conectado ao banco de dados MySQL.');

  
    const CREATE_TABLE_QUERY = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE
      )`;
  
    await connection.query(CREATE_TABLE_QUERY);
  };


  

// Criar usuário
app.post('/users',async (req, res) => {
    const { name, email } = req.body;
    const INSERT_USER_QUERY = `INSERT INTO users (name, email) VALUES (?, ?)`;
    
    await connection.query(INSERT_USER_QUERY, [name, email], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Usuário criado com sucesso', id: results.insertId });
    });
  });
  

// Obter todos os usuários
app.get('/users',async (req, res) => {
    await connection.query('SELECT * FROM users');
      res.json(results);
  });
  

//Obter usuário por id
app.get('/users/:id', async(req,res)=> {
    const { id } = req.params;
    console.log("/users/:id")
    await connection.query('SELECT * FROM users WHERE id = ?', [id],
        (err, results) => {
            console.log(results);
            if(err) return res.status(500).json({ error: err.message});
            if(results.length === 0) {
                return res.status(404).json({ error: "Usuário não encontrado" });
            }
            res.json(results[0]);
        });
});

//Atualizar usuário
app.put('/users/:id', async(req, res) => {
    const { id } = req.params;
    const { name, email } =req.body;
    const   UPDATE_USER_QUERY = `UPDATE users SET name = ?, email = ? WHERE id = ?`
    await connection.query(UPDATE_USER_QUERY, [name, email, id],(err, results) => {
        if (err) return res.status(500).json({error: err.message});
        if (results.affectedRows === 0){
            return res.status(404).json({error: 'Usuário não encontrado'});
        }
        res.json({message: 'Usuário atualizado com sucesso'});
    });
});

//Deletar usuário 
app.delete('/users/:id',async (req, res) => {
    const { id } = req.params;
    const DELETE_USER_QUERY = 'DELETE FROM users WHERE id = ?';
    await connection.query(DELETE_USER_QUERY, [id], (err, results) =>{
        if (err) return res.status(500).json({error: err.message});
        if (results.affectedRows === 0){
            return res.status(404).json({error: 'Usuário não encontrado'});
        }
        res.json({message: 'Usuário deletado com sucesso'})
    });
});

let server;

initDB().then(()=>{
   server = app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));

});


module.exports = {app, server, connection};