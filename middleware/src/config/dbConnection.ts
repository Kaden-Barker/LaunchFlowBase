import knex from "knex";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: {
      ca: process.env.SSL_CERTIFICATE,
      rejectUnauthorized: true,
    },
  },
};

export const db = knex(dbConfig);