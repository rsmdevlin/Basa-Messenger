import { Router, type Request, type Response } from "express";
import { query, queryOne, execute } from "../lib/db";

const router = Router();

// GET /api/users?q=search
router.get("/", async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    let users;

    if (q) {
      users = await query(
        "SELECT id, username, email, display_name, avatar_url, status FROM users WHERE username LIKE ? OR email LIKE ? LIMIT 50",
        [`%${q}%`, `%${q}%`]
      );
    } else {
      users = await query(
        "SELECT id, username, email, display_name, avatar_url, status FROM users LIMIT 50"
      );
    }

    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to search users" });
  }
});

// GET /api/users/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = await queryOne(
      "SELECT id, username, email, display_name, avatar_url, bio, status FROM users WHERE id = ?",
      [req.params.id]
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to get user" });
  }
});

// PATCH /api/users/:id
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { displayName, bio, avatarUrl, status } = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (displayName !== undefined) {
      updates.push("display_name = ?");
      values.push(displayName);
    }
    if (bio !== undefined) {
      updates.push("bio = ?");
      values.push(bio);
    }
    if (avatarUrl !== undefined) {
      updates.push("avatar_url = ?");
      values.push(avatarUrl);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(req.params.id);
    await execute(
      `UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`,
      values
    );

    const user = await queryOne(
      "SELECT id, username, email, display_name, avatar_url, bio, status FROM users WHERE id = ?",
      [req.params.id]
    );

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to update user" });
  }
});

export default router;
