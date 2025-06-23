// mongoClient.js
const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI
const client = new MongoClient(uri)
let db

async function connectToMongo() {
    try {
        await client.connect()
        db = client.db('MilaPlus') // Coloque o nome do seu banco
        console.log('✅ MongoDB connected.')
    } catch (e) {
        console.log("❌ It wasn't possible to connect to MongoDB.")
        // console.error('Não foi possível conectar ao MongoDB', e)
        // process.exit(1) // Encerra a aplicação se não conseguir conectar
    }
}

function getDb() {
    if (!db) {
        console.log("❌ MongoDB couldn't be connected.")
        // throw new Error('Conexão com MongoDB não estabelecida.')
    }
    return db
}

module.exports = { connectToMongo, getDb }
