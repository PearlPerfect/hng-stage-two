const Sequelize = require('sequelize');
import { PostgresDialect } from '@sequelize/postgres';
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  "username": "localhost",
  "password": process.env.PASSWORD ,
  "database": process.env.DATABASE,
  "host": "127.0.0.1", // Replace with your Postgres database name
});

try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}


module.exports = sequelize;
