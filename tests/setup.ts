import { afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri("factory_productivity_test");

const { connectMongoDB, disconnectMongoDB } = await import("../src/lib/mongo");

await connectMongoDB();

afterAll(async () => {
  await disconnectMongoDB();
  await mongo.stop();
});
