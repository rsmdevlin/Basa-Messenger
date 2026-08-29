import { Router, type Request, type Response } from "express";
import { db, users } from "@workspace/db";
import { eq, like, or } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

// Middleware для верификации JWT
function verifyAuth(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    (req as any).userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// GET /api/users - search users
router.get("/", async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";

    if (q.length < 1) {
      return res.json({ users: [] });
    }

    const searchUsers = await db
      .select()
      .from(users)
      .where(
        or(
          like(users.username, `%${q}%`),
          like(users.displayName, `%${q}%`),
          like(users.email, `%${q}%`)
        )
      )
      .limit(20);

    const result = searchUsers.map((u) => {
      const { passwordHash, ...rest } = u;
      return rest;
    });

    res.json({ users: result });
  } catch (err: any) {
    logger.error(err, "Search users error");
    res.status(500).json({ message: "Search failed" });
  }
});

// GET /api/users/:id - get user profile
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const userResult = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult[0];
    const { passwordHash, ...rest } = user;

    res.json({ user: rest });
  } catch (err: any) {
    logger.error(err, "Get user error");
    res.status(500).json({ message: "Failed to get user" });
  }
});

// PATCH /api/users/:id - update user profile (auth required)
router.patch("/:id", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    if (id !== userId) {
      return res.status(403).json({ message: "Cannot edit other users" });
    }

    const { displayName, bio, avatar, status } = req.body;
    const updates: any = {};

    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (status !== undefined) updates.status = status;
    updates.updatedAt = new Date();

    await db.update(users).set(updates).where(eq(users.id, id));

    const updatedUser = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (updatedUser.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = updatedUser[0];
    const { passwordHash, ...rest } = user;

    res.json({ user: rest });
  } catch (err: any) {
    logger.error(err, "Update user error");
    res.status(500).json({ message: "Update failed" });
  }
});

export default router;
