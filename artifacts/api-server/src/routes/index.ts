import { Router } from "express";
import { authMiddleware } from "../lib/auth-middleware";
import authRoutes from "./auth";
import usersRoutes from "./users";
import chatsRoutes from "./chats";
import groupsRoutes from "./groups";
import channelsRoutes from "./channels";
import adminRoutes from "./admin";

const router = Router();

// Public routes (no auth needed)
router.use("/auth", authRoutes);

// Protected routes (auth required)
router.use("/users", authMiddleware, usersRoutes);
router.use("/chats", authMiddleware, chatsRoutes);
router.use("/groups", authMiddleware, groupsRoutes);
router.use("/channels", authMiddleware, channelsRoutes);
router.use("/admin", authMiddleware, adminRoutes);

export default router;
