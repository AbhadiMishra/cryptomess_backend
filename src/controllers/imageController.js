import { randomUUID } from "node:crypto";
import Image from "../models/Image.js";
import User from "../models/User.js";
import {
  uploadEncryptedBuffer,
  getObjectStream,
  getObjectUrl,
  getSignedObjectUrl
} from "../config/minio.js";
import {
  sanitizeVector,
  generateDummyVector,
  cosineSimilarity
} from "../utils/vector.js";
import { getSocketServer } from "../utils/socket.js";

function canAccessImage(image, userId) {
  return String(image.senderId) === String(userId) || String(image.recipientId) === String(userId);
}

function serializeImage(image) {
  return {
    id: image._id,
    senderId: image.senderId,
    recipientId: image.recipientId,
    originalName: image.originalName,
    originalMimeType: image.originalMimeType,
    sizeBytes: image.sizeBytes,
    iv: image.iv,
    vector: image.vector,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt
  };
}

export async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Encrypted file is required" });
    }

    const { iv, recipientEmail, vector, originalName, originalMimeType } = req.body;

    if (!iv || typeof iv !== "string") {
      return res.status(400).json({ message: "Encryption IV is required" });
    }

    let recipient = null;
    if (recipientEmail) {
      recipient = await User.findOne({ email: recipientEmail.toLowerCase().trim() });
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }
    }

    const objectKey = `${req.user.id}/${Date.now()}-${randomUUID()}.enc`;
    await uploadEncryptedBuffer({
      objectKey,
      buffer: req.file.buffer,
      contentType: req.file.mimetype || "application/octet-stream"
    });

    const parsedVector = sanitizeVector(vector);
    // Placeholder vector generation keeps search endpoints functional before ML embedding is plugged in.
    const finalVector = parsedVector || generateDummyVector();

    const image = await Image.create({
      senderId: req.user.id,
      recipientId: recipient?._id || null,
      objectKey,
      objectUrl: getObjectUrl(objectKey),
      iv,
      vector: finalVector,
      originalName: originalName || "encrypted-image",
      originalMimeType: originalMimeType || "image/jpeg",
      sizeBytes: req.file.size,
      mimeType: req.file.mimetype || "application/octet-stream"
    });

    const io = getSocketServer();
    if (io && recipient?._id) {
      // Basic real-time scaffold: recipient dashboard can refresh when a new encrypted image arrives.
      io.to(`user:${recipient._id}`).emit("image:new", {
        imageId: image._id,
        senderId: req.user.id,
        createdAt: image.createdAt
      });
    }

    return res.status(201).json({
      message: "Encrypted image uploaded",
      image: serializeImage(image)
    });
  } catch (error) {
    return next(error);
  }
}

export async function listImages(req, res, next) {
  try {
    const images = await Image.find({
      $or: [{ senderId: req.user.id }, { recipientId: req.user.id }]
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({
      images: images.map((image) => ({
        id: image._id,
        senderId: image.senderId,
        recipientId: image.recipientId,
        originalName: image.originalName,
        originalMimeType: image.originalMimeType,
        sizeBytes: image.sizeBytes,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt
      }))
    });
  } catch (error) {
    return next(error);
  }
}

export async function getImageById(req, res, next) {
  try {
    const image = await Image.findById(req.params.id).lean();

    if (!image || !canAccessImage(image, req.user.id)) {
      return res.status(404).json({ message: "Image not found" });
    }

    const signedUrl = await getSignedObjectUrl(image.objectKey, 60 * 60);

    return res.json({
      image: {
        id: image._id,
        senderId: image.senderId,
        recipientId: image.recipientId,
        originalName: image.originalName,
        originalMimeType: image.originalMimeType,
        sizeBytes: image.sizeBytes,
        iv: image.iv,
        vector: image.vector,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
        encryptedUrl: signedUrl
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function searchImages(req, res, next) {
  try {
    const { queryVector } = req.body;
    const parsedQueryVector = sanitizeVector(queryVector);

    if (!parsedQueryVector) {
      return res.status(400).json({ message: "A valid queryVector is required" });
    }

    const images = await Image.find({
      $or: [{ senderId: req.user.id }, { recipientId: req.user.id }]
    })
      .select("senderId recipientId originalName sizeBytes createdAt vector")
      .lean();

    const scoredImages = images
      .map((image) => ({
        ...image,
        score: cosineSimilarity(parsedQueryVector, image.vector)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((image) => ({
        id: image._id,
        senderId: image.senderId,
        recipientId: image.recipientId,
        originalName: image.originalName,
        originalMimeType: image.originalMimeType,
        sizeBytes: image.sizeBytes,
        createdAt: image.createdAt,
        score: image.score
      }));

    return res.json({ results: scoredImages });
  } catch (error) {
    return next(error);
  }
}

export async function getImageContent(req, res, next) {
  try {
    const image = await Image.findById(req.params.id).lean();

    if (!image || !canAccessImage(image, req.user.id)) {
      return res.status(404).json({ message: "Image not found" });
    }

    const stream = await getObjectStream(image.objectKey);
    res.setHeader("Content-Type", image.mimeType || "application/octet-stream");
    stream.on("error", next);
    stream.pipe(res);
    return undefined;
  } catch (error) {
    return next(error);
  }
}
