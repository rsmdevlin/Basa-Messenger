import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../lib/logger";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "90d";

// Mock database (будет заменена на реальную БД)
interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  displayName: string | null;
  avatar: string | null;
  createdAt: Date;
}

const users: Map<string, User> = new Map();
const refreshTokens: Map<string, string> = new Map();

function userResponse(user: User) {
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

    const existingUser = Array.from(users.values()).find(
      (u) => u.email === email || u.username === username
    );

    if (existingUser) {
      return res.status(409).json({ message: "Email or username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const newUser: User = {
      id: userId,
      email,
      username,
      passwordHash,
      displayName: displayName || null,
      avatar: null,
      createdAt: new Date(),
    };

    users.set(userId, newUser);

    const accessToken = jwt.sign({ userId, email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign({ userId, email }, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    refreshTokens.set(userId, refreshToken);

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      user: userResponse(newUser),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 30 * 24 * 60 * 60, // 30 days
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

    const user = Array.from(users.values()).find((u) => u.email === email);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

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

    refreshTokens.set(user.id, refreshToken);

    logger.info(`User logged in: ${email}`);

    res.json({
      user: userResponse(user),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 30 * 24 * 60 * 60,
      },
    });
  } catch (err: any) {
    logger.error(err, "Login error");
    res.status(500).json({ message: "Login failed" });
  }
});

// POST /api/auth/refresh
router.post("/refresh", (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Missing refresh token" });
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
      userId: string;
      email: string;
    };
    const user = users.get(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const newAccessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const newRefreshToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    refreshTokens.set(user.id, newRefreshToken);

    res.json({
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 30 * 24 * 60 * 60,
      },
    });
  } catch (err: any) {
    logger.error(err, "Token refresh error");
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

// GET /api/auth/me
router.get("/me", (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Missing authorization token" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = users.get(decoded.userId);

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
router.post("/logout", (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      refreshTokens.delete(decoded.userId);
    }

    res.json({ message: "Logged out successfully" });
  } catch (err: any) {
    logger.error(err, "Logout error");
    res.status(500).json({ message: "Logout failed" });
  }
});

export default router;
