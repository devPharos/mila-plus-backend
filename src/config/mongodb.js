// mongoClient.js
const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI
const client = new MongoClient(uri)
let db

async function connectToMongo() {
    try {
        await client.connect()
        db = client.db('MilaPlus') // Coloque o nome do seu banco
        console.log('Conectado ao MongoDB.')
    } catch (e) {
        console.error('Não foi possível conectar ao MongoDB', e)
        process.exit(1) // Encerra a aplicação se não conseguir conectar
    }
}

function getDb() {
    if (!db) {
        throw new Error('Conexão com MongoDB não estabelecida.')
    }
    return db
}

module.exports = { connectToMongo, getDb }
