import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import chatsRouter from "./chats";
import groupsRouter from "./groups";
import channelsRouter from "./channels";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/chats", chatsRouter);
router.use("/groups", groupsRouter);
router.use("/channels", channelsRouter);
router.use("/admin", adminRouter);

export default router;
