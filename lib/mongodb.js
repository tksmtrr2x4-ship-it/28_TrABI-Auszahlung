import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI ist nicht gesetzt. Bitte in .env.local eintragen (siehe .env.local.example)."
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((mongoose) => mongoose)
      .catch((err) => {
        // Ohne dies bleibt ein fehlgeschlagener Verbindungsversuch als
        // "gecachte" rejected Promise stehen und jeder weitere Request in
        // derselben (warmen) Serverless-Instanz schlägt sofort wieder fehl,
        // auch wenn Atlas/Netzwerk sich längst erholt haben.
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
