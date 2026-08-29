import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { getPool } from "./lib/db";

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

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), routes: "mounted" });
});

// Test endpoint to verify routing works
app.get("/api/test", (req, res) => {
  res.json({ message: "API routing works", timestamp: new Date().toISOString() });
});

app.use("/api", router);

// Initialize database connection
export async function initializeApp() {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    connection.release();
    logger.info("✅ Database connection verified");
  } catch (error) {
    logger.error(error, "Failed to connect to database");
    process.exit(1);
  }
}

export default app;

