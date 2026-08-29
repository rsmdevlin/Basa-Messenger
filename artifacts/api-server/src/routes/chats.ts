import { Router, type Request, type Response } from "express";
import { query, queryOne, execute } from "../lib/db";

const router = Router();

// GET /api/chats - список чатов пользователя
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId; // From auth middleware
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const chats = await query(
      `SELECT c.*,
        CASE WHEN c.user_id_1 = ? THEN u2.id ELSE u1.id END as other_user_id,
        CASE WHEN c.user_id_1 = ? THEN u2.username ELSE u1.username END as other_username,
        CASE WHEN c.user_id_1 = ? THEN u2.display_name ELSE u1.display_name END as other_display_name,
        CASE WHEN c.user_id_1 = ? THEN u2.avatar_url ELSE u1.avatar_url END as other_avatar,
        CASE WHEN c.user_id_1 = ? THEN u2.status ELSE u1.status END as other_status,
        COUNT(DISTINCT CASE WHEN m.deleted_at IS NULL THEN m.id END) as message_count
       FROM chats c
       LEFT JOIN users u1 ON c.user_id_1 = u1.id
       LEFT JOIN users u2 ON c.user_id_2 = u2.id
       LEFT JOIN messages m ON c.id = m.chat_id
       WHERE c.user_id_1 = ? OR c.user_id_2 = ?
       GROUP BY c.id
       ORDER BY c.last_message_at DESC
       LIMIT 100`,
      [userId, userId, userId, userId, userId, userId, userId]
    );

    const formatted = chats.map((chat: any) => ({
      id: chat.id,
      userId1: chat.user_id_1,
      userId2: chat.user_id_2,
      lastMessageId: chat.last_message_id,
      lastMessageAt: chat.last_message_at,
      otherUser: {
        id: chat.other_user_id,
        username: chat.other_username,
        displayName: chat.other_display_name,
        avatar: chat.other_avatar,
        status: chat.other_status,
      },
      unreadCount: 0,
    }));

    res.json({ chats: formatted });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load chats" });
  }
});

// POST /api/chats - создать новый чат
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { otherUserId } = req.body;
    if (!otherUserId) return res.status(400).json({ message: "Missing otherUserId" });

    // Check if chat already exists
    const existing = await queryOne(
      "SELECT * FROM chats WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)",
      [userId, otherUserId, otherUserId, userId]
    );

    if (existing) {
      return res.json({ chat: existing });
    }

    // Create new chat
    await execute(
      "INSERT INTO chats (user_id_1, user_id_2, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
      [userId, otherUserId]
    );

    const chat = await queryOne(
      "SELECT * FROM chats WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)",
      [userId, otherUserId, otherUserId, userId]
    );

    res.status(201).json({ chat });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to create chat" });
  }
});

// GET /api/chats/:id - деталь чата
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const chat = await queryOne("SELECT * FROM chats WHERE id = ?", [req.params.id]);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    res.json({ chat });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to get chat" });
  }
});

// GET /api/chats/:id/messages - сообщения в чате
router.get("/:id/messages", async (req: Request, res: Response) => {
  try {
    const messages = await query(
      `SELECT m.*, u.username, u.display_name
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.chat_id = ? AND m.deleted_at IS NULL
       ORDER BY m.created_at DESC
       LIMIT 100`,
      [req.params.id]
    );

    res.json({ messages: messages.reverse() });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load messages" });
  }
});

// POST /api/chats/:id/messages - отправить сообщение
router.post("/:id/messages", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Missing content" });

    await execute(
      "INSERT INTO messages (chat_id, sender_id, content, created_at) VALUES (?, ?, ?, NOW())",
      [req.params.id, userId, content]
    );

    // Update chat last_message_at
    await execute(
      "UPDATE chats SET last_message_at = NOW() WHERE id = ?",
      [req.params.id]
    );

    const message = await queryOne(
      "SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1",
      [req.params.id]
    );

    res.status(201).json({ message });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to send message" });
  }
});

// PATCH /api/messages/:id - редактировать сообщение
router.patch("/messages/:id", async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Missing content" });

    await execute(
      "UPDATE messages SET content = ?, edited_at = NOW() WHERE id = ?",
      [content, req.params.id]
    );

    const message = await queryOne("SELECT * FROM messages WHERE id = ?", [req.params.id]);
    res.json({ message });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to update message" });
  }
});

// DELETE /api/messages/:id - удалить сообщение
router.delete("/messages/:id", async (req: Request, res: Response) => {
  try {
    await execute(
      "UPDATE messages SET deleted_at = NOW() WHERE id = ?",
      [req.params.id]
    );

    res.json({ message: "Message deleted" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to delete message" });
  }
});

// POST /api/chats/:id/read - отметить как прочитано
router.post("/:id/read", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    res.json({ message: "Chat marked as read" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to mark as read" });
  }
});

export default router;
