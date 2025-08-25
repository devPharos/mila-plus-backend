// src/middlewares/transactionHandler.js

import { Sequelize } from 'sequelize'
import databaseConfig from '../../config/database.js'

const transactionHandler = async (req, res, next) => {
    if (req.method !== 'GET') {
        const connection = new Sequelize(databaseConfig)
        req?.transaction = await connection.transaction()
    }
    next() // Continua para o próximo middleware/controller
}

export default transactionHandler
