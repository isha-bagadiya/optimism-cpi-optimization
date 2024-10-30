// app/api/store-percentages/route.ts
import { NextResponse } from "next/server";
import { MongoServerError } from "mongodb";
import clientPromise from "@/lib/db/mongo";

// Reusable database connection
let cachedClient: any = null;
let cachedDb: any = null;

async function connectToDatabase() {
  try {
    if (cachedClient && cachedDb) {
      return { client: cachedClient, db: cachedDb };
    }

    const client = await clientPromise;
    const db = client.db("copidatabase");

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error("Database connection error:", error);
    throw new Error("Failed to connect to database");
  }
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { percentages, timestamp } = body;

    console.log("Received data:", { percentages, timestamp });

    // Validate the incoming data
    if (!percentages || !timestamp) {
      console.log("Missing required fields:", { percentages, timestamp }); // Debug log
      return NextResponse.json(
        {
          message: "Missing required fields",
          details: { percentages, timestamp },
        },
        { status: 400 }
      );
    }

    // Validate all required percentage fields
    const requiredFields = [
      "Token House",
      "Citizen House",
      "Grants Council",
      "Grants Council (Milestone & Metrics Sub-committee)",
      "Security Council",
      "Code of Conduct Council",
      "Developer Advisory Board",
    ];

    const missingFields = requiredFields.filter((field) => !percentages[field]);
    if (missingFields.length > 0) {
      console.log("Missing percentage fields:", missingFields); // Debug log
      return NextResponse.json(
        { message: `Missing percentage fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate that all percentages are valid numbers
    for (const field of requiredFields) {
      const value = parseFloat(percentages[field]);
      if (isNaN(value) || value < 0 || value > 100) {
        return NextResponse.json(
          { message: `Invalid percentage value for ${field}` },
          { status: 400 }
        );
      }
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const councilPercentagesCollection = db.collection("councilpercentages");

    // Prepare the document to store
    const newPercentageEntry = {
      token_house: parseFloat(percentages["Token House"]),
      citizen_house: parseFloat(percentages["Citizen House"]),
      grants_council: parseFloat(percentages["Grants Council"]),
      grants_council_subcommittee: parseFloat(
        percentages["Grants Council (Milestone & Metrics Sub-committee)"]
      ),
      security_council: parseFloat(percentages["Security Council"]),
      code_of_conduct_council: parseFloat(
        percentages["Code of Conduct Council"]
      ),
      developer_advisory_board: parseFloat(
        percentages["Developer Advisory Board"]
      ),
      timestamp: new Date(timestamp),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert the new percentages document
    const result = await councilPercentagesCollection.insertOne(
      newPercentageEntry
    );

    if (!result.acknowledged) {
      throw new Error("Failed to insert document");
    }

    // Return a success response
    return NextResponse.json(
      {
        message: "Council percentages stored successfully",
        percentagesId: result.insertedId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error storing council percentages:", error);

    // Handle MongoDB errors
    if (error instanceof MongoServerError) {
      return NextResponse.json(
        { message: "Error storing council percentages", error: error.message },
        { status: 500 }
      );
    } else {
      // General error handling
      return NextResponse.json(
        { message: "Unknown error occurred", error: "Unknown error" },
        { status: 500 }
      );
    }
  }
}

// GET endpoint to retrieve historical data
export async function GET() {
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const councilPercentagesCollection = db.collection("councilpercentages");

    // Get the latest entries, sorted by timestamp
    const results = await councilPercentagesCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    // Return success response
    return NextResponse.json(
      {
        message: "Council percentages retrieved successfully",
        data: results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving council percentages:", error);

    // Handle MongoDB errors
    if (error instanceof MongoServerError) {
      return NextResponse.json(
        {
          message: "Error retrieving council percentages",
          error: error.message,
        },
        { status: 500 }
      );
    } else {
      // General error handling
      return NextResponse.json(
        { message: "Unknown error occurred", error: "Unknown error" },
        { status: 500 }
      );
    }
  }
}
