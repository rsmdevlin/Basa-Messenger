import { Router, type Request, type Response } from "express";
import { db, channels, channelSubscribers, channelPosts, users } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../lib/logger";
import jwt from "jsonwebtoken";

const router = Router();

function verifyAuth(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any;
    (req as any).userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// GET /api/channels - list channels
router.get("/", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const channelList = await db
      .select()
      .from(channels)
      .orderBy(desc(channels.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ channels: channelList });
  } catch (err: any) {
    logger.error(err, "List channels error");
    res.status(500).json({ message: "Failed to list channels" });
  }
});

// POST /api/channels - create channel
router.post("/", verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, username, description, avatar, isPublic } = req.body;

    if (!name || !username) {
      return res.status(400).json({ message: "Name and username required" });
    }

    // Check username uniqueness
    const existing = await db
      .select()
      .from(channels)
      .where(eq(channels.username, username))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const channelId = uuidv4();

    const newChannel = {
      id: channelId,
      name,
      username,
      description: description || null,
      avatar: avatar || null,
      ownerId: userId,
      isPublic: isPublic !== false,
      memberCount: 1,
    };

    await db.insert(channels).values(newChannel);

    // Subscribe owner
    await db.insert(channelSubscribers).values({
      id: uuidv4(),
      channelId,
      userId,
      role: "owner",
    });

    res.status(201).json({ channel: newChannel });
  } catch (err: any) {
    logger.error(err, "Create channel error");
    res.status(500).json({ message: "Failed to create channel" });
  }
});

// GET /api/channels/:id - get channel detail
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const channel = await db.select().from(channels).where(eq(channels.id, id)).limit(1);

    if (channel.length === 0) {
      return res.status(404).json({ message: "Channel not found" });
    }

    res.json({ channel: channel[0] });
  } catch (err: any) {
    logger.error(err, "Get channel error");
    res.status(500).json({ message: "Failed to get channel" });
  }
});

// PATCH /api/channels/:id - update channel
router.patch("/:id", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { name, description, avatar, isPublic } = req.body;

    const channel = await db.select().from(channels).where(eq(channels.id, id)).limit(1);

    if (channel.length === 0) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (channel[0].ownerId !== userId) {
      return res.status(403).json({ message: "Only owner can update channel" });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (avatar !== undefined) updates.avatar = avatar;
    if (isPublic !== undefined) updates.isPublic = isPublic;
    updates.updatedAt = new Date();

    await db.update(channels).set(updates).where(eq(channels.id, id));

    res.json({ message: "Channel updated" });
  } catch (err: any) {
    logger.error(err, "Update channel error");
    res.status(500).json({ message: "Failed to update channel" });
  }
});

// GET /api/channels/:id/subscribers - get subscribers
router.get("/:id/subscribers", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subs = await db
      .select()
      .from(channelSubscribers)
      .where(eq(channelSubscribers.channelId, id));

    res.json({ subscribers: subs });
  } catch (err: any) {
    logger.error(err, "Get subscribers error");
    res.status(500).json({ message: "Failed to get subscribers" });
  }
});

// POST /api/channels/:id/subscribe - subscribe to channel
router.post("/:id/subscribe", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const channel = await db.select().from(channels).where(eq(channels.id, id)).limit(1);

    if (channel.length === 0) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if already subscribed
    const existing = await db
      .select()
      .from(channelSubscribers)
      .where(and(eq(channelSubscribers.channelId, id), eq(channelSubscribers.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ message: "Already subscribed" });
    }

    await db.insert(channelSubscribers).values({
      id: uuidv4(),
      channelId: id,
      userId,
      role: "subscriber",
    });

    // Update member count
    const newCount = await db
      .select()
      .from(channelSubscribers)
      .where(eq(channelSubscribers.channelId, id))
      .then((s) => s.length);

    await db.update(channels).set({ memberCount: newCount }).where(eq(channels.id, id));

    res.status(201).json({ message: "Subscribed" });
  } catch (err: any) {
    logger.error(err, "Subscribe error");
    res.status(500).json({ message: "Failed to subscribe" });
  }
});

// DELETE /api/channels/:id/subscribe - unsubscribe
router.delete("/:id/subscribe", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    await db
      .delete(channelSubscribers)
      .where(and(eq(channelSubscribers.channelId, id), eq(channelSubscribers.userId, userId)));

    // Update member count
    const newCount = await db
      .select()
      .from(channelSubscribers)
      .where(eq(channelSubscribers.channelId, id))
      .then((s) => s.length);

    await db.update(channels).set({ memberCount: newCount }).where(eq(channels.id, id));

    res.json({ message: "Unsubscribed" });
  } catch (err: any) {
    logger.error(err, "Unsubscribe error");
    res.status(500).json({ message: "Failed to unsubscribe" });
  }
});

// POST /api/channels/:id/posts - create post
router.post("/:id/posts", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { content, mediaId } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content required" });
    }

    const channel = await db.select().from(channels).where(eq(channels.id, id)).limit(1);

    if (channel.length === 0) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if user is subscriber/admin
    const sub = await db
      .select()
      .from(channelSubscribers)
      .where(and(eq(channelSubscribers.channelId, id), eq(channelSubscribers.userId, userId)))
      .limit(1);

    if (sub.length === 0 || (sub[0].role === "subscriber")) {
      return res.status(403).json({ message: "Cannot post in channel" });
    }

    const newPost = {
      id: uuidv4(),
      channelId: id,
      authorId: userId,
      content,
      mediaId: mediaId || null,
      viewCount: 0,
      isPinned: false,
      editedAt: null,
      deletedAt: null,
    };

    await db.insert(channelPosts).values(newPost);

    res.status(201).json({ post: newPost });
  } catch (err: any) {
    logger.error(err, "Create post error");
    res.status(500).json({ message: "Failed to create post" });
  }
});

// GET /api/channels/:id/posts - get posts
router.get("/:id/posts", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const posts = await db
      .select()
      .from(channelPosts)
      .where(and(eq(channelPosts.channelId, id), eq(channelPosts.deletedAt, null)))
      .orderBy(desc(channelPosts.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ posts });
  } catch (err: any) {
    logger.error(err, "Get posts error");
    res.status(500).json({ message: "Failed to get posts" });
  }
});

export default router;
