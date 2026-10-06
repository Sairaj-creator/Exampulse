import cron from "node-cron";
import { finalizeExpired } from "../services/attemptService.js";

/**
 * Sweeper job to automatically finalize abandoned or timed-out exam attempts.
 * Runs once every minute.
 */
export function startExpiredAttemptsSweeper() {
  const task = cron.schedule("* * * * *", async () => {
    try {
      const count = await finalizeExpired();
      if (count > 0) {
        console.log(
          `[Sweeper] Finalized ${count} expired exam attempt(s) due to timeout.`,
        );
      }
    } catch (err) {
      console.error("[Sweeper] Error finalizing expired attempts:", err.message);
    }
  });

  return task;
}
