import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI; 
const dbName = process.env.MONGODB_DBNAME || 'MilaPlus';

export const isMongoEnabled =
  typeof uri === 'string' && /^mongodb(\+srv)?:\/\//.test(uri);

let client;
let db;
let connecting;

export async function connectToMongo() {
  if (!isMongoEnabled) {
    console.warn('Mongo OFF: MONGODB_URI ausente/invalid.');
    return null;
  }
  if (db) return db;
  if (connecting) return connecting;

  client = new MongoClient(uri, {
   
  });

  connecting = client
    .connect()
    .then(() => {
      db = client.db(dbName);
      console.log('✅ MongoDB connected.');
      return db;
    })
    .catch((err) => {
      console.error('MongoDB connection failed:', err.message);
      return null; 
    })
    .finally(() => {
      connecting = null;
    });

  return connecting;
}

export function getDb() {
  if (!db) {
    console.warn('Mongo DB not initialized. Use connectToMongo() first.');
    return null;
  }
  return db;
}

export async function closeMongo() {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}
