// From the documents:
// You must use the same client instance for all statements within
// a transaction. PostgreSQL isolates a transaction to individual
// clients. This means if you initialize or use transactions with
// the pool.query method you will have problems.
// Do not use transactions with the pool.query method.

const { Pool } = require('pg');
const config = require('config');
const { errorHandler } = require('../util/error_handler');

const pool = new Pool({
  user: config.get('database_user'),
  host: config.get('database_host'),
  database: config.get('database_name'),
  password: config.get('database_password'),
  port: config.get('database_port'),
});

pool.on('error', async (err, client) => {
  await errorHandler(err);
  process.exit(-1)
})

module.exports = {
  query: (text, params) => pool.query(text, params)
}