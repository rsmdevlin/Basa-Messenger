import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { verifyConnection } from "@workspace/db";

const app: Express = express();

// CORS конфигурация
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize database connection
export async function initializeApp() {
  try {
    const connected = await verifyConnection();
    if (!connected) {
      logger.error("Failed to connect to database");
      process.exit(1);
    }
    logger.info("✅ Database initialized successfully");
  } catch (error) {
    logger.error(error, "Failed to initialize app");
    process.exit(1);
  }
}

export default app;

