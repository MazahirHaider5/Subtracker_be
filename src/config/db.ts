import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const uri: string = process.env.DB_CONNECTION_STRING ?? "";
    if (!uri) {
      console.log("Database connection string is missing");
      
    }

    await mongoose.connect(uri);
    console.log("Database Connected");
  } catch (error) {
    console.log("Database connection failed:", (error as Error).message);
  }
};

export default connectDB;
