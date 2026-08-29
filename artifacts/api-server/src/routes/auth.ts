import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../lib/logger";
import { query, queryOne, execute } from "../lib/db";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

interface User {
  id: bigint;
  username: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  status: string | null;
  avatar_tone: string | null;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

function userResponse(user: Partial<User>) {
  const { password_hash, ...rest } = user;
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
    const existingUser = await queryOne<User>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const existingUsername = await queryOne<User>(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (existingUsername) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = BigInt(Date.now()); // Use timestamp for ID

    await execute(
      "INSERT INTO users (id, email, username, display_name, password_hash, status, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, email, username, displayName || null, passwordHash, "offline", false]
    );

    const newUser = {
      id: userId,
      email,
      username,
      display_name: displayName || null,
      password_hash: passwordHash,
      avatar_url: null,
      bio: null,
      status: "offline",
      avatar_tone: null,
      is_admin: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const accessToken = jwt.sign({ userId: userId.toString(), email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign({ userId: userId.toString(), email }, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await execute(
      "INSERT INTO sessions (user_id, token, refresh_token, expires_at, refresh_expires_at, last_activity_at) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, accessToken, refreshToken, refreshTokenExpiry, refreshTokenExpiry, new Date()]
    );

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      user: userResponse(newUser),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60,
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

    const user = await queryOne<User>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = jwt.sign({ userId: user.id.toString(), email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign({ userId: user.id.toString(), email: user.email }, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await execute(
      "INSERT INTO sessions (user_id, token, refresh_token, expires_at, refresh_expires_at, last_activity_at) VALUES (?, ?, ?, ?, ?, ?)",
      [user.id, accessToken, refreshToken, refreshTokenExpiry, refreshTokenExpiry, new Date()]
    );

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

    const user = await queryOne<User>(
      "SELECT * FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const newAccessToken = jwt.sign({ userId: user.id.toString(), email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const newRefreshToken = jwt.sign({ userId: user.id.toString(), email: user.email }, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await execute(
      "INSERT INTO sessions (user_id, token, refresh_token, expires_at, refresh_expires_at, last_activity_at) VALUES (?, ?, ?, ?, ?, ?)",
      [user.id, newAccessToken, newRefreshToken, refreshTokenExpiry, refreshTokenExpiry, new Date()]
    );

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

    const user = await queryOne<User>(
      "SELECT * FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: userResponse(user) });
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
        // Delete session for this user
        await execute(
          "DELETE FROM sessions WHERE user_id = ? AND token = ?",
          [decoded.userId, token]
        );
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

