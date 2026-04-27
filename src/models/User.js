import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    picture: { type: String },
    refreshTokenHash: { type: String }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
