import { Router, type Request, type Response } from "express";
import { query, queryOne, execute } from "../lib/db";

const router = Router();

// GET /api/groups - список групп пользователя
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const groups = await query(
      `SELECT g.*, COUNT(DISTINCT gm.user_id) as member_count
       FROM groups g
       LEFT JOIN group_members gm ON g.id = gm.group_id
       WHERE g.owner_id = ? OR g.id IN (SELECT group_id FROM group_members WHERE user_id = ?)
       GROUP BY g.id
       ORDER BY g.created_at DESC
       LIMIT 100`,
      [userId, userId]
    );

    res.json({ groups });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load groups" });
  }
});

// POST /api/groups - создать группу
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { name, description, isPublic } = req.body;
    if (!name) return res.status(400).json({ message: "Missing name" });

    await execute(
      "INSERT INTO groups (name, description, owner_id, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [name, description || null, userId, isPublic || false]
    );

    const group = await queryOne(
      "SELECT * FROM groups WHERE owner_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    // Add owner as member
    await execute(
      "INSERT INTO group_members (group_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())",
      [group.id, userId, "owner"]
    );

    res.status(201).json({ group });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to create group" });
  }
});

// GET /api/groups/:id - деталь группы
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const group = await queryOne("SELECT * FROM groups WHERE id = ?", [req.params.id]);
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json({ group });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to get group" });
  }
});

// GET /api/groups/:id/messages - сообщения в группе
router.get("/:id/messages", async (req: Request, res: Response) => {
  try {
    const messages = await query(
      `SELECT gm.*, u.username, u.display_name
       FROM group_messages gm
       LEFT JOIN users u ON gm.sender_id = u.id
       WHERE gm.group_id = ? AND gm.deleted_at IS NULL
       ORDER BY gm.created_at DESC
       LIMIT 100`,
      [req.params.id]
    );

    res.json({ messages: messages.reverse() });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load messages" });
  }
});

// POST /api/groups/:id/messages - отправить сообщение
router.post("/:id/messages", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Missing content" });

    await execute(
      "INSERT INTO group_messages (group_id, sender_id, content, created_at) VALUES (?, ?, ?, NOW())",
      [req.params.id, userId, content]
    );

    const message = await queryOne(
      "SELECT * FROM group_messages WHERE group_id = ? ORDER BY created_at DESC LIMIT 1",
      [req.params.id]
    );

    res.status(201).json({ message });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to send message" });
  }
});

// GET /api/groups/:id/members - члены группы
router.get("/:id/members", async (req: Request, res: Response) => {
  try {
    const members = await query(
      `SELECT gm.*, u.username, u.display_name, u.avatar_url
       FROM group_members gm
       LEFT JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?
       ORDER BY gm.joined_at`,
      [req.params.id]
    );

    res.json({ members });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load members" });
  }
});

// POST /api/groups/:id/members - добавить члена
router.post("/:id/members", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    await execute(
      "INSERT INTO group_members (group_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())",
      [req.params.id, userId, "member"]
    );

    res.status(201).json({ message: "Member added" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to add member" });
  }
});

// DELETE /api/groups/:id/members/:memberId - удалить члена
router.delete("/:id/members/:memberId", async (req: Request, res: Response) => {
  try {
    await execute(
      "DELETE FROM group_members WHERE group_id = ? AND user_id = ?",
      [req.params.id, req.params.memberId]
    );

    res.json({ message: "Member removed" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to remove member" });
  }
});

export default router;
