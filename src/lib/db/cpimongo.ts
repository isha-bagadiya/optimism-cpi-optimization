import { MongoClient, MongoClientOptions } from "mongodb";

export async function connectDB() {
  const client = await MongoClient.connect(
    process.env.NEXT_PUBLIC_CPI_MONGODB_URI!,
    {
      dbName: "CPI",
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // serverSelectionTimeoutMS: 30000,
      // socketTimeoutMS: 45000,
    } as MongoClientOptions
  );

  return client;
}
