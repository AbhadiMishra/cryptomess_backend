import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    objectKey: { type: String, required: true, unique: true },
    objectUrl: { type: String, required: true },
    iv: { type: String, required: true },
    vector: { type: [Number], default: [] },
    originalName: { type: String, default: "encrypted-image" },
    originalMimeType: { type: String, default: "image/jpeg" },
    sizeBytes: { type: Number, required: true },
    mimeType: { type: String, default: "application/octet-stream" }
  },
  { timestamps: true }
);

const Image = mongoose.model("Image", imageSchema);

export default Image;
