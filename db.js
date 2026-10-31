import { MongoClient } from "mongodb";

// We keep the connection in a variable so it is reused between requests
let cachedDb;

export async function getDb() {
  if (cachedDb) return cachedDb;

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  cachedDb = client.db("booknook");
  return cachedDb;
}
