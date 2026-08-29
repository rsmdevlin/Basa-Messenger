import { Router, type Request, type Response } from "express";
import { db, groups, groupMembers, groupMessages, users } from "@workspace/db";
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

// GET /api/groups - list user groups
router.get("/", verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const userGroups = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));

    const groupIds = userGroups.map((gm) => gm.groupId);

    if (groupIds.length === 0) {
      return res.json({ groups: [] });
    }

    const groupList = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupIds[0]))
      .then(async (gs) => {
        // Fetch all groups
        const result = [];
        for (const groupId of groupIds) {
          const g = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
          if (g.length > 0) result.push(g[0]);
        }
        return result;
      });

    res.json({ groups: groupList });
  } catch (err: any) {
    logger.error(err, "List groups error");
    res.status(500).json({ message: "Failed to list groups" });
  }
});

// POST /api/groups - create group
router.post("/", verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, description, avatar, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Group name required" });
    }

    const groupId = uuidv4();

    const newGroup = {
      id: groupId,
      name,
      description: description || null,
      avatar: avatar || null,
      ownerId: userId,
      isPublic: isPublic || false,
    };

    await db.insert(groups).values(newGroup);

    // Add creator as member
    await db.insert(groupMembers).values({
      id: uuidv4(),
      groupId,
      userId,
      role: "owner",
    });

    res.status(201).json({ group: newGroup });
  } catch (err: any) {
    logger.error(err, "Create group error");
    res.status(500).json({ message: "Failed to create group" });
  }
});

// GET /api/groups/:id - get group detail
router.get("/:id", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const group = await db.select().from(groups).where(eq(groups.id, id)).limit(1);

    if (group.length === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is member
    const isMember = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, id), eq(groupMembers.userId, userId)))
      .limit(1);

    if (!group[0].isPublic && isMember.length === 0) {
      return res.status(403).json({ message: "Access denied" });
    }

    const members = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, id));

    res.json({ group: group[0], memberCount: members.length });
  } catch (err: any) {
    logger.error(err, "Get group error");
    res.status(500).json({ message: "Failed to get group" });
  }
});

// GET /api/groups/:id/members - get group members
router.get("/:id/members", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const group = await db.select().from(groups).where(eq(groups.id, id)).limit(1);

    if (group.length === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    const members = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, id));

    const memberDetails = await Promise.all(
      members.map(async (m) => {
        const user = await db.select().from(users).where(eq(users.id, m.userId)).limit(1);
        return {
          ...m,
          user: user[0] ? { ...user[0], passwordHash: undefined } : null,
        };
      })
    );

    res.json({ members: memberDetails });
  } catch (err: any) {
    logger.error(err, "Get members error");
    res.status(500).json({ message: "Failed to get members" });
  }
});

// PATCH /api/groups/:id - update group
router.patch("/:id", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { name, description, avatar, isPublic } = req.body;

    const group = await db.select().from(groups).where(eq(groups.id, id)).limit(1);

    if (group.length === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group[0].ownerId !== userId) {
      return res.status(403).json({ message: "Only owner can update group" });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (avatar !== undefined) updates.avatar = avatar;
    if (isPublic !== undefined) updates.isPublic = isPublic;
    updates.updatedAt = new Date();

    await db.update(groups).set(updates).where(eq(groups.id, id));

    res.json({ message: "Group updated" });
  } catch (err: any) {
    logger.error(err, "Update group error");
    res.status(500).json({ message: "Failed to update group" });
  }
});

// POST /api/groups/:id/members - add member to group
router.post("/:id/members", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { newMemberId } = req.body;

    if (!newMemberId) {
      return res.status(400).json({ message: "New member ID required" });
    }

    const group = await db.select().from(groups).where(eq(groups.id, id)).limit(1);

    if (group.length === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group[0].ownerId !== userId) {
      return res.status(403).json({ message: "Only owner can add members" });
    }

    // Check if already member
    const existing = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, id), eq(groupMembers.userId, newMemberId)))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ message: "Already a member" });
    }

    await db.insert(groupMembers).values({
      id: uuidv4(),
      groupId: id,
      userId: newMemberId,
      role: "member",
    });

    res.status(201).json({ message: "Member added" });
  } catch (err: any) {
    logger.error(err, "Add member error");
    res.status(500).json({ message: "Failed to add member" });
  }
});

// DELETE /api/groups/:id/members/:memberId - remove member
router.delete("/:id/members/:memberId", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const userId = (req as any).userId;

    const group = await db.select().from(groups).where(eq(groups.id, id)).limit(1);

    if (group.length === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group[0].ownerId !== userId && userId !== memberId) {
      return res.status(403).json({ message: "Cannot remove member" });
    }

    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, id), eq(groupMembers.userId, memberId)));

    res.json({ message: "Member removed" });
  } catch (err: any) {
    logger.error(err, "Remove member error");
    res.status(500).json({ message: "Failed to remove member" });
  }
});

// POST /api/groups/:id/messages - send message to group
router.post("/:id/messages", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { content, mediaId } = req.body;

    if (!content && !mediaId) {
      return res.status(400).json({ message: "Content or mediaId required" });
    }

    const group = await db.select().from(groups).where(eq(groups.id, id)).limit(1);

    if (group.length === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is member
    const isMember = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, id), eq(groupMembers.userId, userId)))
      .limit(1);

    if (isMember.length === 0) {
      return res.status(403).json({ message: "Not a member" });
    }

    const newMessage = {
      id: uuidv4(),
      groupId: id,
      senderId: userId,
      content: content || null,
      mediaId: mediaId || null,
      editedAt: null,
      deletedAt: null,
      replyToId: null,
    };

    await db.insert(groupMessages).values(newMessage);

    res.status(201).json({ message: newMessage });
  } catch (err: any) {
    logger.error(err, "Send group message error");
    res.status(500).json({ message: "Failed to send message" });
  }
});

// GET /api/groups/:id/messages - get group messages
router.get("/:id/messages", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const group = await db.select().from(groups).where(eq(groups.id, id)).limit(1);

    if (group.length === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is member or group is public
    const isMember = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, id), eq(groupMembers.userId, userId)))
      .limit(1);

    if (!group[0].isPublic && isMember.length === 0) {
      return res.status(403).json({ message: "Access denied" });
    }

    const msgs = await db
      .select()
      .from(groupMessages)
      .where(eq(groupMessages.groupId, id))
      .orderBy(desc(groupMessages.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ messages: msgs.reverse() });
  } catch (err: any) {
    logger.error(err, "Get group messages error");
    res.status(500).json({ message: "Failed to get messages" });
  }
});

export default router;
