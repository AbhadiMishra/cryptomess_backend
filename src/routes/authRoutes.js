import express from "express";
import {
  googleAuth,
  refreshAccessToken,
  logout,
  me
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const authRouter = express.Router();

authRouter.post("/google", googleAuth);
authRouter.post("/refresh", refreshAccessToken);
authRouter.post("/logout", logout);
authRouter.get("/me", authMiddleware, me);

export default authRouter;
