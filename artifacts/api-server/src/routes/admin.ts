import { Router, type Request, type Response } from "express";
import { db, users, chats, groups, channels, messages, groupMessages, channelPosts, media, notifications, blockedUsers, adminLogs } from "@workspace/db";
import { eq, and, or, desc, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../lib/logger";
import jwt from "jsonwebtoken";

const router = Router();

interface AdminUser extends Request {
  userId?: string;
  isAdmin?: boolean;
}

function verifyAuth(req: AdminUser, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any;
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

async function verifyAdmin(req: AdminUser, res: Response, next: any) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Not authenticated" });

    const user = await db.select().from(users).where(eq(users.id, req.userId)).limit(1);

    if (user.length === 0) return res.status(404).json({ message: "User not found" });

    // Check if user has admin role (stored as metadata or separate table)
    const isAdmin = user[0].isAdmin === true || false; // Need to add isAdmin field to users table

    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.isAdmin = true;
    next();
  } catch (err) {
    return res.status(500).json({ message: "Admin verification failed" });
  }
}

async function logAdminAction(userId: string, action: string, target: string, details?: any) {
  try {
    await db.insert(adminLogs).values({
      id: uuidv4(),
      adminId: userId,
      action,
      targetType: target,
      targetId: details?.targetId || null,
      details: JSON.stringify(details || {}),
    });
  } catch (err) {
    logger.error(err, "Failed to log admin action");
  }
}

// GET /api/admin/dashboard - get admin dashboard stats
router.get("/dashboard", verifyAuth, verifyAdmin, async (req: AdminUser, res: Response) => {
  try {
    const totalUsers = await db.select().from(users).then((u) => u.length);
    const totalChats = await db.select().from(chats).then((c) => c.length);
    const totalGroups = await db.select().from(groups).then((g) => g.length);
    const totalChannels = await db.select().from(channels).then((c) => c.length);
    const totalMessages = await db.select().from(messages).then((m) => m.length);

    const recentUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10);

    res.json({
      stats: {
        totalUsers,
        totalChats,
        totalGroups,
        totalChannels,
        totalMessages,
      },
      recentUsers: recentUsers.map((u) => ({ ...u, passwordHash: undefined })),
    });
  } catch (err: any) {
    logger.error(err, "Dashboard error");
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

// GET /api/admin/users - list users with search
router.get("/users", verifyAuth, verifyAdmin, async (req: AdminUser, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    let userList;
    if (q) {
      userList = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.username, q),
            eq(users.email, q)
          )
        )
        .limit(limit)
        .offset(offset);
    } else {
      userList = await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);
    }

    res.json({
      users: userList.map((u) => ({ ...u, passwordHash: undefined })),
    });
  } catch (err: any) {
    logger.error(err, "List users error");
    res.status(500).json({ message: "Failed to list users" });
  }
});

// GET /api/admin/users/:id - get user details
router.get("/users/:id", verifyAuth, verifyAdmin, async (req: AdminUser, res: Response) => {
  try {
    const { id } = req.params;

    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userChats = await db.select().from(chats).where(or(eq(chats.userId1, id), eq(chats.userId2, id)));
    const userGroups = await db.select().from(groups).where(eq(groups.ownerId, id));
    const userChannels = await db.select().from(channels).where(eq(channels.ownerId, id));
    const userMessages = await db.select().from(messages).where(eq(messages.senderId, id));

    res.json({
      user: { ...user[0], passwordHash: undefined },
      stats: {
        chats: userChats.length,
        groups: userGroups.length,
        channels: userChannels.length,
        messages: userMessages.length,
      },
    });
  } catch (err: any) {
    logger.error(err, "Get user error");
    res.status(500).json({ message: "Failed to get user" });
  }
});

// PATCH /api/admin/users/:id - update user
router.patch("/users/:id", verifyAuth, verifyAdmin, async (req: AdminUser, res: Response) => {
  try {
    const { id } = req.params;
    const { displayName, bio, avatar, status, isBlocked } = req.body;

    const updates: any = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (status !== undefined) updates.status = status;
    if (isBlocked !== undefined) updates.isBlocked = isBlocked;
    updates.updatedAt = new Date();

    await db.update(users).set(updates).where(eq(users.id, id));

    await logAdminAction(req.userId!, "UPDATE_USER", "user", { targetId: id, changes: updates });

    res.json({ message: "User updated" });
  } catch (err: any) {
    logger.error(err, "Update user error");
    res.status(500).json({ message: "Failed to update user" });
  }
});

// DELETE /api/admin/users/:id - delete user
router.delete("/users/:id", verifyAuth, verifyAdmin, async (req: AdminUser, res: Response) => {
  try {
    const { id } = req.params;

    if (req.userId === id) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    await db.delete(users).where(eq(users.id, id));

    await logAdminAction(req.userId!, "DELETE_USER", "user", { targetId: id });

    res.json({ message: "User deleted" });
  } catch (err: any) {
    logger.error(err, "Delete user error");
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// POST /api/admin/users/:id/block - block user
router.post("/users/:id/block", verifyAuth, verifyAdmin, async (req: AdminUser, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await db.update(users).set({ isBlocked: true }).where(eq(users.id, id));

    await logAdminAction(req.userId!, "BLOCK_USER", "user", { targetId: id, reason });

    res.json({ message: "User blocked" });
  } catch (err: any) {
    logger.error(err, "Block user error");
    res.status(500).json({ message: "Failed to block user" });
  }
});

// POST /api/admin/users/:id/unblock - unblock user
router.post("/users/:id/unblock", verifyAuth, verifyAdmin, async (req: AdminUser, res: Response) => {
  try {
    const { id } = req.params;

    await db.update(users).set({ isBlocked: false }).where(eq(users.id, id));

    await logAdminAction(req.userId!, "UNBLOCK_USER", "user", { targetId: id });

    res.json({ message: "User unblocked" });
  } catch (err: any) {
    logger.error(err, "Unblock user error");
    res.status(500).json({ message: "Failed to unblock user" });
  }
});

// GET /api/admin/content - list content for moderation
router.get("/content", verifyAuth, verifyAdmin, async (req: AdminUser, res: Response) => {
  try {
    const type = req.query.type as string || "messages"; // messages, posts, media
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    let content;

    if (type === "messages") {
      content = await db
        .select()
        .from(messages)
        .orderBy(desc(messages.createdAt))
        .limit(limit)
        .offset(offset);
    } else if (type === "posts") {
      content = await db
        .select()
        .from(channelPosts)
        .orderBy(desc(channelPosts.createdAt))
        .limit(limit)
        .offset(offset);
    } else if (type === "media") {
      content = await db
        .select()
        .from(media)
        .orderBy(desc(media.createdAt))
        .limit(limit)
        .offset(offset);
    }

    res.json({ content, type });
  } catch (err: any) {
    logger.error(err, "List content error");
    res.status(500).json({ message: "Failed to list content" });
  }
});

// DELETE /api/admin/messages/:id - delete message
router.delete("/messages/:id", verifyAuth, verifyAdmin, async (req: AdminUser, res: Response) => {
  try {
    const { id } = req.params;

    await db.update(messages).set({ deletedAt: new Date() }).where(eq(messages.id, id));

    await logAdminAction(req.userId!, "DELETE_MESSAGE", "message", { targetId: id });

    res.json({ message: "Message deleted" });
  } catch (err: any) {
    logger.error(err, "Delete message error");
    res.status(500).json({ message: "Failed to delete message" });
  }
});

// DELETE /api/admin/posts/:id - delete post
router.delete("/posts/:id", verifyAuth, verifyAdmin, async (req: AdminUser, res: Response) => {
  try {
    const { id } = req.params;

    await db.update(channelPosts).set({ deletedAt: new Date() }).where(eq(channelPosts.id, id));

    await logAdminAction(req.userId!, "DELETE_POST", "post", { targetId: id });

    res.json({ message: "Post deleted" });
  } catch (err: any) {
    logger.error(err, "Delete post error");
    res.status(500).json({ message: "Failed to delete post" });
  }
});

// GET /api/admin/logs - get admin action logs
router.get("/logs", verifyAuth, verifyAdmin, async (req: AdminUser, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const logs = await db
      .select()
      .from(adminLogs)
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ logs });
  } catch (err: any) {
    logger.error(err, "Get logs error");
    res.status(500).json({ message: "Failed to get logs" });
  }
});

// GET /api/admin/stats - detailed stats
router.get("/stats", verifyAuth, verifyAdmin, async (req: AdminUser, res: Response) => {
  try {
    const allUsers = await db.select().from(users);
    const allChats = await db.select().from(chats);
    const allGroups = await db.select().from(groups);
    const allChannels = await db.select().from(channels);
    const allMessages = await db.select().from(messages);

    const blockedUsersCount = allUsers.filter((u) => u.isBlocked).length;
    const activeToday = allUsers.filter((u) => {
      if (!u.lastSeen) return false;
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return new Date(u.lastSeen) > dayAgo;
    }).length;

    res.json({
      users: {
        total: allUsers.length,
        blocked: blockedUsersCount,
        activeToday,
      },
      chats: {
        total: allChats.length,
      },
      groups: {
        total: allGroups.length,
      },
      channels: {
        total: allChannels.length,
      },
      messages: {
        total: allMessages.length,
      },
    });
  } catch (err: any) {
    logger.error(err, "Get stats error");
    res.status(500).json({ message: "Failed to get stats" });
  }
});

export default router;
