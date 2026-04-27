import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  uploadImage,
  listImages,
  getImageById,
  getImageContent,
  searchImages
} from "../controllers/imageController.js";

const imageRouter = express.Router();

imageRouter.get("/", authMiddleware, listImages);
imageRouter.post("/upload", authMiddleware, upload.single("file"), uploadImage);
imageRouter.get("/:id/content", authMiddleware, getImageContent);
imageRouter.get("/:id", authMiddleware, getImageById);
imageRouter.post("/search", authMiddleware, searchImages);

export default imageRouter;
