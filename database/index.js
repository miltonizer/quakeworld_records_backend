const { Pool } = require('pg');
const config = require('config');

const pool = new Pool({
    user: config.get('database_user'),
    host: config.get('database_host'),
    database: config.get('database_name'),
    password: config.get('database_password'),
    port: config.get('database_port'),
});

module.exports = {
  query: (text, params) => pool.query(text, params),
}