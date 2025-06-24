import 'dotenv/config'

export default {
    dialect: 'postgres',
    host: process.env.DB_HOSTNAME,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    idleTimeoutMillis: 30000,
    logging: false,
    max: 20,
    connectionTimeoutMillis: 10000,
    define: {
        timestamps: true,
        createdAt: 'created_at', // Personaliza o nome da coluna
        updatedAt: 'updated_at', // Personaliza o nome da coluna
        paranoid: true, // Habilita soft delete
        deletedAt: 'canceled_at', // Usa canceled_at em vez de deletedAt
        underscored: true,
        underscoredAll: true,
    },
}
