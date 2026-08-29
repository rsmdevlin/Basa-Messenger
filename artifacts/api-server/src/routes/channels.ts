import { Router, type Request, type Response } from "express";
import { query, queryOne, execute } from "../lib/db";

const router = Router();

// GET /api/channels - список каналов
router.get("/", async (req: Request, res: Response) => {
  try {
    const channels = await query(
      `SELECT c.*, COUNT(DISTINCT cs.user_id) as member_count
       FROM channels c
       LEFT JOIN channel_subscribers cs ON c.id = cs.channel_id
       WHERE c.is_public = 1 OR c.owner_id = ? OR c.id IN (SELECT channel_id FROM channel_subscribers WHERE user_id = ?)
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT 100`,
      [(req as any).userId || 0, (req as any).userId || 0]
    );

    res.json({ channels });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load channels" });
  }
});

// POST /api/channels - создать канал
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { name, username, description, isPublic } = req.body;
    if (!name || !username) return res.status(400).json({ message: "Missing required fields" });

    // Check if username is taken
    const existing = await queryOne("SELECT * FROM channels WHERE username = ?", [username]);
    if (existing) return res.status(409).json({ message: "Username already taken" });

    await execute(
      "INSERT INTO channels (name, username, description, owner_id, is_public, member_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [name, username, description || null, userId, isPublic || true, 1]
    );

    const channel = await queryOne(
      "SELECT * FROM channels WHERE owner_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    // Add owner as subscriber
    await execute(
      "INSERT INTO channel_subscribers (channel_id, user_id, role, subscribed_at) VALUES (?, ?, ?, NOW())",
      [channel.id, userId, "owner"]
    );

    res.status(201).json({ channel });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to create channel" });
  }
});

// GET /api/channels/:id - деталь канала
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const channel = await queryOne("SELECT * FROM channels WHERE id = ?", [req.params.id]);
    if (!channel) return res.status(404).json({ message: "Channel not found" });
    res.json({ channel });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to get channel" });
  }
});

// PATCH /api/channels/:id - обновить канал
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }

    if (updates.length === 0) return res.status(400).json({ message: "No fields to update" });

    values.push(req.params.id);
    await execute(
      `UPDATE channels SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`,
      values
    );

    const channel = await queryOne("SELECT * FROM channels WHERE id = ?", [req.params.id]);
    res.json({ channel });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to update channel" });
  }
});

// GET /api/channels/:id/posts - посты в канале
router.get("/:id/posts", async (req: Request, res: Response) => {
  try {
    const posts = await query(
      `SELECT cp.*, u.username, u.display_name
       FROM channel_posts cp
       LEFT JOIN users u ON cp.author_id = u.id
       WHERE cp.channel_id = ? AND cp.deleted_at IS NULL
       ORDER BY cp.is_pinned DESC, cp.created_at DESC
       LIMIT 100`,
      [req.params.id]
    );

    res.json({ posts });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load posts" });
  }
});

// POST /api/channels/:id/posts - создать пост
router.post("/:id/posts", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Missing content" });

    await execute(
      "INSERT INTO channel_posts (channel_id, author_id, content, created_at) VALUES (?, ?, ?, NOW())",
      [req.params.id, userId, content]
    );

    const post = await queryOne(
      "SELECT * FROM channel_posts WHERE channel_id = ? ORDER BY created_at DESC LIMIT 1",
      [req.params.id]
    );

    res.status(201).json({ post });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to create post" });
  }
});

// POST /api/channels/:id/subscribe - подписаться на канал
router.post("/:id/subscribe", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const existing = await queryOne(
      "SELECT * FROM channel_subscribers WHERE channel_id = ? AND user_id = ?",
      [req.params.id, userId]
    );

    if (existing) return res.json({ message: "Already subscribed" });

    await execute(
      "INSERT INTO channel_subscribers (channel_id, user_id, role, subscribed_at) VALUES (?, ?, ?, NOW())",
      [req.params.id, userId, "subscriber"]
    );

    // Increase member count
    await execute(
      "UPDATE channels SET member_count = member_count + 1 WHERE id = ?",
      [req.params.id]
    );

    res.json({ message: "Subscribed" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to subscribe" });
  }
});

// DELETE /api/channels/:id/subscribe - отписаться от канала
router.delete("/:id/subscribe", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await execute(
      "DELETE FROM channel_subscribers WHERE channel_id = ? AND user_id = ?",
      [req.params.id, userId]
    );

    // Decrease member count
    await execute(
      "UPDATE channels SET member_count = member_count - 1 WHERE id = ? AND member_count > 0",
      [req.params.id]
    );

    res.json({ message: "Unsubscribed" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to unsubscribe" });
  }
});

// GET /api/channels/:id/subscribers - подписчики канала
router.get("/:id/subscribers", async (req: Request, res: Response) => {
  try {
    const subscribers = await query(
      `SELECT cs.*, u.username, u.display_name, u.avatar_url
       FROM channel_subscribers cs
       LEFT JOIN users u ON cs.user_id = u.id
       WHERE cs.channel_id = ?
       ORDER BY cs.subscribed_at`,
      [req.params.id]
    );

    res.json({ subscribers });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load subscribers" });
  }
});

export default router;
