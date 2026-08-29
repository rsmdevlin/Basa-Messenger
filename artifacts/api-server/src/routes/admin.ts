import { Router, type Request, type Response } from "express";
import { query, queryOne, execute } from "../lib/db";

const router = Router();

// Middleware для проверки админ статуса
async function checkAdmin(req: Request, res: Response, next: any) {
  try {
    const userId = (req as any).userId;
    const user = await queryOne("SELECT is_admin FROM users WHERE id = ?", [userId]);

    if (!user || !user.is_admin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: "Failed to verify admin status" });
  }
}

router.use(checkAdmin);

// GET /api/admin/dashboard - информация о системе
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const [[usersCount]] = await query(
      "SELECT COUNT(*) as count FROM users"
    );
    const [[chatsCount]] = await query(
      "SELECT COUNT(*) as count FROM chats"
    );
    const [[messagesCount]] = await query(
      "SELECT COUNT(*) as count FROM messages WHERE deleted_at IS NULL"
    );
    const [[groupsCount]] = await query(
      "SELECT COUNT(*) as count FROM groups"
    );

    res.json({
      dashboard: {
        totalUsers: usersCount?.count || 0,
        totalChats: chatsCount?.count || 0,
        totalMessages: messagesCount?.count || 0,
        totalGroups: groupsCount?.count || 0,
        timestamp: new Date(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

// GET /api/admin/users - список пользователей
router.get("/users", async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    let users;

    if (q) {
      users = await query(
        "SELECT id, username, email, display_name, is_admin, created_at FROM users WHERE username LIKE ? OR email LIKE ? LIMIT 100",
        [`%${q}%`, `%${q}%`]
      );
    } else {
      users = await query(
        "SELECT id, username, email, display_name, is_admin, created_at FROM users LIMIT 100"
      );
    }

    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load users" });
  }
});

// PATCH /api/admin/users/:id - обновить пользователя
router.patch("/users/:id", async (req: Request, res: Response) => {
  try {
    const { isAdmin, displayName } = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (isAdmin !== undefined) {
      updates.push("is_admin = ?");
      values.push(isAdmin);
    }
    if (displayName !== undefined) {
      updates.push("display_name = ?");
      values.push(displayName);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(req.params.id);
    await execute(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    // Log action
    const adminId = (req as any).userId;
    await execute(
      "INSERT INTO admin_logs (admin_id, action, target_type, target_id, created_at) VALUES (?, ?, ?, ?, NOW())",
      [adminId, "UPDATE_USER", "user", req.params.id]
    );

    const user = await queryOne(
      "SELECT id, username, email, display_name, is_admin FROM users WHERE id = ?",
      [req.params.id]
    );

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to update user" });
  }
});

// POST /api/admin/users/:id/block - заблокировать пользователя
router.post("/users/:id/block", async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    await execute(
      "INSERT INTO blocked_users (user_id, blocked_user_id, reason, created_at) VALUES (?, ?, ?, NOW())",
      [(req as any).userId, req.params.id, reason || null]
    );

    // Log action
    const adminId = (req as any).userId;
    await execute(
      "INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [adminId, "BLOCK_USER", "user", req.params.id, JSON.stringify({ reason })]
    );

    res.json({ message: "User blocked" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to block user" });
  }
});

// POST /api/admin/users/:id/unblock - разблокировать пользователя
router.post("/users/:id/unblock", async (req: Request, res: Response) => {
  try {
    await execute(
      "DELETE FROM blocked_users WHERE blocked_user_id = ?",
      [req.params.id]
    );

    // Log action
    const adminId = (req as any).userId;
    await execute(
      "INSERT INTO admin_logs (admin_id, action, target_type, target_id, created_at) VALUES (?, ?, ?, ?, NOW())",
      [adminId, "UNBLOCK_USER", "user", req.params.id]
    );

    res.json({ message: "User unblocked" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to unblock user" });
  }
});

// DELETE /api/admin/messages/:id - удалить сообщение
router.delete("/messages/:id", async (req: Request, res: Response) => {
  try {
    const message = await queryOne("SELECT * FROM messages WHERE id = ?", [req.params.id]);
    if (!message) return res.status(404).json({ message: "Message not found" });

    await execute(
      "UPDATE messages SET deleted_at = NOW() WHERE id = ?",
      [req.params.id]
    );

    // Log action
    const adminId = (req as any).userId;
    await execute(
      "INSERT INTO admin_logs (admin_id, action, target_type, target_id, created_at) VALUES (?, ?, ?, ?, NOW())",
      [adminId, "DELETE_MESSAGE", "message", req.params.id]
    );

    res.json({ message: "Message deleted" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to delete message" });
  }
});

// GET /api/admin/logs - логи админских действий
router.get("/logs", async (req: Request, res: Response) => {
  try {
    const logs = await query(
      `SELECT al.*, u.username as admin_username
       FROM admin_logs al
       LEFT JOIN users u ON al.admin_id = u.id
       ORDER BY al.created_at DESC
       LIMIT 100`
    );

    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to load logs" });
  }
});

export default router;
