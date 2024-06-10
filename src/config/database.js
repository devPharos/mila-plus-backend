require('dotenv').config();
module.exports = {
  dialect: 'postgres',
  host: process.env.DB_HOSTNAME,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  define: {
    timestamps: false,
    underscored: true,
    underscoredAll: true,
  },
  logging: false,
};
