import { Router } from "express";
import { authMiddleware } from "../lib/auth-middleware";
import authRoutes from "./auth";
import usersRoutes from "./users";
import chatsRoutes from "./chats";
import groupsRoutes from "./groups";
import channelsRoutes from "./channels";
import adminRoutes from "./admin";

const router = Router();

console.log("🔌 Mounting API routes...");

// Public routes (no auth needed)
router.use("/auth", authRoutes);
console.log("✅ Auth routes mounted");

// Protected routes (auth required)
router.use("/users", authMiddleware, usersRoutes);
console.log("✅ Users routes mounted");

router.use("/chats", authMiddleware, chatsRoutes);
console.log("✅ Chats routes mounted");

router.use("/groups", authMiddleware, groupsRoutes);
console.log("✅ Groups routes mounted");

router.use("/channels", authMiddleware, channelsRoutes);
console.log("✅ Channels routes mounted");

router.use("/admin", authMiddleware, adminRoutes);
console.log("✅ Admin routes mounted");

console.log("🎉 All API routes mounted successfully!");

export default router;
