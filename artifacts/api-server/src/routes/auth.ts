import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../lib/logger";
import { db, users, refreshTokens } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

function userResponse(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, username, password, displayName } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUsername.length > 0) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const newUser = {
      id: userId,
      email,
      username,
      displayName: displayName || null,
      passwordHash,
      avatar: null,
      bio: null,
      status: "offline",
      lastSeen: null,
      isBlocked: false,
    };

    await db.insert(users).values(newUser);

    const accessToken = jwt.sign({ userId, email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign({ userId, email }, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await db.insert(refreshTokens).values({
      id: uuidv4(),
      userId,
      token: refreshToken,
      expiresAt: refreshTokenExpiry,
    });

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      user: userResponse(newUser),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
      },
    });
  } catch (err: any) {
    logger.error(err, "Registration error");
    res.status(500).json({ message: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (userResult.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = userResult[0];
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await db.insert(refreshTokens).values({
      id: uuidv4(),
      userId: user.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiry,
    });

    logger.info(`User logged in: ${email}`);

    res.json({
      user: userResponse(user),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60,
      },
    });
  } catch (err: any) {
    logger.error(err, "Login error");
    res.status(500).json({ message: "Login failed" });
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Missing refresh token" });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET) as {
        userId: string;
        email: string;
      };
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const userResult = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);

    if (userResult.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = userResult[0];

    const newAccessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const newRefreshToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await db.insert(refreshTokens).values({
      id: uuidv4(),
      userId: user.id,
      token: newRefreshToken,
      expiresAt: refreshTokenExpiry,
    });

    res.json({
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60,
      },
    });
  } catch (err: any) {
    logger.error(err, "Token refresh error");
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

// GET /api/auth/me
router.get("/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Missing authorization token" });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userResult = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: userResponse(userResult[0]) });
  } catch (err: any) {
    logger.error(err, "Auth me error");
    res.status(401).json({ message: "Unauthorized" });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (token) {
      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        // Optional: delete refresh tokens for this user
        // await db.delete(refreshTokens).where(eq(refreshTokens.userId, decoded.userId));
      } catch (err) {
        // Token is already invalid
      }
    }

    res.json({ message: "Logged out successfully" });
  } catch (err: any) {
    logger.error(err, "Logout error");
    res.status(500).json({ message: "Logout failed" });
  }
});

export default router;
