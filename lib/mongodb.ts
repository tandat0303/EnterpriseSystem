import { MongoClient } from "mongodb";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

// MongoDB native driver client (local)
// let client;
// let clientPromise: Promise<MongoClient>;

// if (process.env.NODE_ENV === "development") {
//   const globalWithMongo = global as typeof global & { _mongoClientPromise?: Promise<MongoClient> };
//   if (!globalWithMongo._mongoClientPromise) {
//     client = new MongoClient(MONGODB_URI, {
//       connectTimeoutMS: 10000,
//       serverSelectionTimeoutMS: 10000,
//     });
//     globalWithMongo._mongoClientPromise = client.connect();
//   }
//   clientPromise = globalWithMongo._mongoClientPromise;
// } else {
//   client = new MongoClient(MONGODB_URI, {
//     connectTimeoutMS: 10000,
//     serverSelectionTimeoutMS: 10000,
//   });
//   clientPromise = client.connect();
// }

// Mongoose connection
const cached = global as typeof global & { mongoose: any };

if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.mongoose.conn) {
    return cached.mongoose.conn;
  }

  if (!cached.mongoose.promise) {
    const opts = {
      bufferCommands: false,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    };

    cached.mongoose.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.mongoose.conn = await cached.mongoose.promise;
  return cached.mongoose.conn;
}

export { dbConnect }; // adding clientPromise if you want to run the application in local environment