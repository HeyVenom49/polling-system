import { env } from "./config/env";
import server from "./server";
import { connectDatabase, disconnectDatabase } from "./database/postgres";
import { connectRedis, disconnectRedis } from "./database/redis";

let isShuttingDown = false;

const shutdown = async (signal: string, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Received ${signal}, shutting down gracefully...`);

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });

  try {
    await disconnectDatabase();
    await disconnectRedis();
  } catch (error) {
    console.error("Error during shutdown cleanup:", error);
    process.exit(1);
  }

  console.log("Shutdown complete");
  process.exit(exitCode);
};

const listen = () =>
  new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => {
      server.removeListener("listening", onListening);
      reject(error);
    };

    const onListening = () => {
      server.removeListener("error", onError);
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(env.PORT);
  });

const startServer = async () => {
  try {
    await connectDatabase();

    try {
      await connectRedis();
    } catch (error) {
      console.error("Redis connection failed, continuing without Redis:", error);
    }

    await listen();
    console.log(`Server is running on port ${env.PORT}`);

    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start server:", error);

    try {
      await disconnectDatabase();
      await disconnectRedis();
    } catch (cleanupError) {
      console.error("Error during startup cleanup:", cleanupError);
    }

    process.exit(1);
  }
};

void startServer();
