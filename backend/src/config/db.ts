import mongoose from 'mongoose';

let memoryServer: import('mongodb-memory-server').MongoMemoryServer | null = null;

/** True when we fell back to the in-memory MongoDB (no MONGODB_URI configured). */
export let usingMemoryDB = false;

/**
 * Connect to MongoDB. If MONGODB_URI is not provided, an in-memory MongoDB is
 * started so the app runs out-of-the-box. In-memory data is ephemeral.
 */
export async function connectDB(): Promise<void> {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    usingMemoryDB = true;
    console.log('⚠️  No MONGODB_URI set — using in-memory MongoDB (data is not persisted).');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName: 'nagarfix' });
  console.log(`✅ MongoDB connected (${usingMemoryDB ? 'in-memory' : 'external'})`);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
