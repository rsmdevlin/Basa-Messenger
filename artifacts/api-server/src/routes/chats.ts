import { Router, type Request, type Response } from "express";
import { db, chats, messages, users, readReceipts } from "@workspace/db";
import { eq, or, and, desc } from "drizzle-orm";
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

// GET /api/chats - list user chats
router.get("/", verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const userChats = await db
      .select()
      .from(chats)
      .where(or(eq(chats.userId1, userId), eq(chats.userId2, userId)))
      .orderBy(desc(chats.lastMessageAt));

    const result = await Promise.all(
      userChats.map(async (chat) => {
        const otherId = chat.userId1 === userId ? chat.userId2 : chat.userId1;
        const otherUser = await db.select().from(users).where(eq(users.id, otherId)).limit(1);

        const unreadCount = await db
          .select()
          .from(messages)
          .where(and(eq(messages.chatId, chat.id), eq(messages.senderId, otherId)))
          .then((msgs) => msgs.filter((m) => !m.deletedAt).length);

        return {
          ...chat,
          otherUser: otherUser[0] ? { ...otherUser[0], passwordHash: undefined } : null,
          unreadCount,
        };
      })
    );

    res.json({ chats: result });
  } catch (err: any) {
    logger.error(err, "List chats error");
    res.status(500).json({ message: "Failed to list chats" });
  }
});

// POST /api/chats - create or get 1-on-1 chat
router.post("/", verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { otherUserId } = req.body;

    if (!otherUserId || otherUserId === userId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Check if chat exists
    const existing = await db
      .select()
      .from(chats)
      .where(
        or(
          and(eq(chats.userId1, userId), eq(chats.userId2, otherUserId)),
          and(eq(chats.userId1, otherUserId), eq(chats.userId2, userId))
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.json({ chat: existing[0] });
    }

    // Create new chat
    const newChat = {
      id: uuidv4(),
      userId1: userId,
      userId2: otherUserId,
      lastMessageId: null,
      lastMessageAt: null,
    };

    await db.insert(chats).values(newChat);

    res.status(201).json({ chat: newChat });
  } catch (err: any) {
    logger.error(err, "Create chat error");
    res.status(500).json({ message: "Failed to create chat" });
  }
});

// GET /api/chats/:id - get chat detail
router.get("/:id", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const chat = await db.select().from(chats).where(eq(chats.id, id)).limit(1);

    if (chat.length === 0) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat[0].userId1 !== userId && chat[0].userId2 !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ chat: chat[0] });
  } catch (err: any) {
    logger.error(err, "Get chat error");
    res.status(500).json({ message: "Failed to get chat" });
  }
});

// GET /api/chats/:id/messages - get messages
router.get("/:id/messages", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const chat = await db.select().from(chats).where(eq(chats.id, id)).limit(1);

    if (chat.length === 0) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat[0].userId1 !== userId && chat[0].userId2 !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, id))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ messages: msgs.reverse() });
  } catch (err: any) {
    logger.error(err, "Get messages error");
    res.status(500).json({ message: "Failed to get messages" });
  }
});

// POST /api/chats/:id/messages - send message
router.post("/:id/messages", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { content, mediaId } = req.body;

    if (!content && !mediaId) {
      return res.status(400).json({ message: "Content or mediaId required" });
    }

    const chat = await db.select().from(chats).where(eq(chats.id, id)).limit(1);

    if (chat.length === 0) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat[0].userId1 !== userId && chat[0].userId2 !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const newMessage = {
      id: uuidv4(),
      chatId: id,
      senderId: userId,
      content: content || null,
      mediaId: mediaId || null,
      editedAt: null,
      deletedAt: null,
      replyToId: null,
    };

    await db.insert(messages).values(newMessage);

    // Update last message in chat
    await db
      .update(chats)
      .set({ lastMessageId: newMessage.id, lastMessageAt: new Date() })
      .where(eq(chats.id, id));

    res.status(201).json({ message: newMessage });
  } catch (err: any) {
    logger.error(err, "Send message error");
    res.status(500).json({ message: "Failed to send message" });
  }
});

// PATCH /api/messages/:id - edit message
router.patch("/messages/:id", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content required" });
    }

    const msg = await db.select().from(messages).where(eq(messages.id, id)).limit(1);

    if (msg.length === 0) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (msg[0].senderId !== userId) {
      return res.status(403).json({ message: "Cannot edit others' messages" });
    }

    await db.update(messages).set({ content, editedAt: new Date() }).where(eq(messages.id, id));

    res.json({ message: "Message updated" });
  } catch (err: any) {
    logger.error(err, "Edit message error");
    res.status(500).json({ message: "Failed to edit message" });
  }
});

// DELETE /api/messages/:id - delete message
router.delete("/messages/:id", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const msg = await db.select().from(messages).where(eq(messages.id, id)).limit(1);

    if (msg.length === 0) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (msg[0].senderId !== userId) {
      return res.status(403).json({ message: "Cannot delete others' messages" });
    }

    await db.update(messages).set({ deletedAt: new Date() }).where(eq(messages.id, id));

    res.json({ message: "Message deleted" });
  } catch (err: any) {
    logger.error(err, "Delete message error");
    res.status(500).json({ message: "Failed to delete message" });
  }
});

// POST /api/chats/:id/read - mark chat as read
router.post("/:id/read", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const chat = await db.select().from(chats).where(eq(chats.id, id)).limit(1);

    if (chat.length === 0) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat[0].userId1 !== userId && chat[0].userId2 !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ message: "Marked as read" });
  } catch (err: any) {
    logger.error(err, "Mark read error");
    res.status(500).json({ message: "Failed to mark as read" });
  }
});

export default router;
