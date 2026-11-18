const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const dbConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,

    // Enable secure TLS connection
    ssl: {
        minVersion: "TLSv1.2"
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function initializeDatabase() {
    const schemaPath = path.join(__dirname, "..", "init.sql");
    const schema = fs.readFileSync(schemaPath, "utf8").replace(
        /CREATE DATABASE IF NOT EXISTS student_management_system;\s*USE student_management_system;\s*/i,
        ""
    );
    const connection = await mysql.createConnection({
        ...dbConfig,
        multipleStatements: true
    });

    try {
        await connection.query(schema);
    } finally {
        await connection.end();
    }
}

module.exports = pool;
module.exports.initializeDatabase = initializeDatabase;
