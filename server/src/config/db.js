import mongoose from "mongoose";
export async function connectDatabase(uri) {
  mongoose.set("bufferCommands", false);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}
export function databaseConnected() {
  return mongoose.connection.readyState === 1;
}
