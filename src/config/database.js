module.exports = {
  dialect: 'postgres',
  host: process.env.NODE_ENV === 'production' && process.env.DB_HOSTNAME
    ? process.env.DB_HOSTNAME
    : 'localhost',
  port: process.env.NODE_ENV === 'production' && process.env.DB_PORT
    ? process.env.DB_PORT
    : 5432,
  username: process.env.NODE_ENV === 'production' ? process.env.DB_USERNAME : 'postgres',
  password: process.env.NODE_ENV === 'production' ? process.env.DB_PASSWORD : '0241',
  database: process.env.NODE_ENV === 'production' ? process.env.DB_DATABASE : 'mila-plus-dev',
  define: {
    timestamps: false,
    underscored: true,
    underscoredAll: true,
  },
  logging: false,
};
