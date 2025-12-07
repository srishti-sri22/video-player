import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `mongodb+srv://srishtisri224:Srishti2204@cluster0.blz3c21.mongodb.net/videoplayer`
    );

    console.log(
      `\n MongoDB connection !! DB-Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
