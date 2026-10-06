import mongoose from "mongoose";
import { loadEnv } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { createApp } from "./app.js";
import { startExpiredAttemptsSweeper } from "./jobs/expiredAttemptsSweeper.js";
const env = loadEnv();
await connectDatabase(env.MONGO_URI);
const sweeper = startExpiredAttemptsSweeper();
const server = createApp({ production: env.NODE_ENV === "production" }).listen(
  env.PORT,
  () => console.log(`ExamPulse API listening on port ${env.PORT}`),
);
async function shutdown() {
  if (sweeper) sweeper.stop();
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
