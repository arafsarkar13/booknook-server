import { MongoClient } from "mongodb";

// We keep the connection in a variable so it is reused between requests
let cachedDb;

export async function getDb() {
  if (cachedDb) return cachedDb;

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db("booknook");

  // One person can have only one active borrow of the same book
  await db
    .collection("borrows")
    .createIndex({ bookId: 1, userEmail: 1 }, { unique: true });

  cachedDb = db;
  return db;
}
