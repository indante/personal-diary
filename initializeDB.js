require('dotenv').config()
const mysql = require('mysql')

var db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_DBNAME,
    insecureAuth: true
});
db.connect();

function initializeDB () {
    db.query(`
        CREATE TABLE if not exists users (
            id INT(11) NOT NULL AUTO_INCREMENT,
            username VARCHAR(20) NOT NULL,
            password VARCHAR(40) NOT NULL,
            PRIMARY KEY(id)
        );
    `)
    db.query(`
        CREATE TABLE if not exists journals (
            id INT(11) NOT NULL AUTO_INCREMENT,
            user_id INT(11) NOT NULL,
            title VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            created_at DATE,
            modified_at DATE,
            PRIMARY KEY(id),
            FOREIGN KEY(user_id) REFERENCES users(id) 
        );
    `)
    db.end()
}

initializeDB()