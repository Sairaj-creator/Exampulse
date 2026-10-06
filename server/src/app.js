import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { databaseConnected } from "./config/db.js";
import { sendSuccess } from "./utils/response.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import { authRoutes } from "./routes/authRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { batchRoutes } from "./routes/batchRoutes.js";
import { subjectRoutes } from "./routes/subjectRoutes.js";
import { questionRoutes } from "./routes/questionRoutes.js";
import { examRoutes } from "./routes/examRoutes.js";
import { studentExamRoutes } from "./routes/studentExamRoutes.js";
import { attemptRoutes } from "./routes/attemptRoutes.js";
import { analyticsRoutes } from "./routes/analyticsRoutes.js";

export function createApp({
  isDatabaseConnected = databaseConnected,
  production = false,
} = {}) {
  const app = express();
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  if (process.env.NODE_ENV !== "production") {
    app.use(
      cors({
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
        credentials: true,
      }),
    );
  }

  app.get("/api/health", (req, res) => {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        error: { code: "DB_UNAVAILABLE", message: "Database disconnected" },
      });
    }
    return sendSuccess(res, {
      status: "ok",
      db: "connected",
      serverNow: new Date().toISOString(),
    });
  });

  // Apply general limiter for API routes
  app.use("/api", generalLimiter);

  // Mount API modules
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/batches", batchRoutes);
  app.use("/api/subjects", subjectRoutes);
  app.use("/api/questions", questionRoutes);
  app.use("/api/exams", examRoutes);
  app.use("/api/student/exams", studentExamRoutes);
  app.use("/api/attempts", attemptRoutes);
  app.use("/api/analytics", analyticsRoutes);

  // Fallback 404 for unmatched /api routes
  app.use("/api", notFound);

  // Single-origin static SPA serving in production
  const clientDist = fileURLToPath(
    new URL("../../client/dist/", import.meta.url),
  );
  if (production && existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (req, res) => res.sendFile(`${clientDist}/index.html`));
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
