import app, { initializeApp } from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] || "5000";
const host = process.env["HOST"] || "0.0.0.0";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  try {
    // Initialize database
    await initializeApp();

    app.listen(port, host, (err?: Error) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ host, port }, "Server listening");
    });
  } catch (error) {
    logger.error(error, "Failed to start server");
    process.exit(1);
  }
}

start();

