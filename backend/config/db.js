import mongoose from "mongoose";

const connectDB = async () => {
  try {
<<<<<<< HEAD
    const connection = await mongoose.connect(
      process.env.MONGODB_URI
    );
=======
    const conn = await mongoose.connect(process.env.MONGODB_URI);
>>>>>>> origin/main

    console.log(
      `🍃 MongoDB Connected: ${connection.connection.host}`
    );
  } catch (error) {
    console.error(
      "❌ MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
};

<<<<<<< HEAD
export default connectDB;
=======
module.exports = connectDB;
>>>>>>> origin/main
