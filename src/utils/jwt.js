import jwt from "jsonwebtoken";
import env from "../config/env.js";

export function createAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture || null
    },
    env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

export function createRefreshToken(user) {
  return jwt.sign({ sub: user._id }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
