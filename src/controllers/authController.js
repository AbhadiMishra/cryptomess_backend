import User from "../models/User.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken
} from "../utils/jwt.js";
import { hashToken } from "../utils/tokenHash.js";
import { verifyGoogleCredential } from "../utils/google.js";
import env from "../config/env.js";

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const clearRefreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax"
};

function mapUser(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    picture: user.picture || ""
  };
}

export async function googleAuth(req, res, next) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const profile = await verifyGoogleCredential(credential);

    let user = await User.findOne({
      $or: [{ googleId: profile.googleId }, { email: profile.email }]
    });

    if (!user) {
      user = await User.create(profile);
    } else {
      user.googleId = profile.googleId;
      user.name = profile.name;
      user.picture = profile.picture;
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    // Store only a hash of the refresh token so leaked DB data cannot be replayed directly.
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    return res.json({
      accessToken,
      user: mapUser(user)
    });
  } catch (error) {
    if (error.response?.status === 400) {
      return res.status(401).json({ message: "Invalid Google credential" });
    }

    return next(error);
  }
}

export async function refreshAccessToken(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Missing refresh token" });
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);

    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ message: "Session not found" });
    }

    const incomingHash = hashToken(refreshToken);
    if (incomingHash !== user.refreshTokenHash) {
      return res.status(401).json({ message: "Refresh token mismatch" });
    }

    // Rotate refresh token on each use to reduce token replay window.
    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);

    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save();

    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);

    return res.json({
      accessToken: newAccessToken,
      user: mapUser(user)
    });
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
}

export async function logout(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await User.findByIdAndUpdate(payload.sub, { refreshTokenHash: null });
    } catch {
      // Ignore expired/invalid refresh token during logout.
    }
  }

  res.clearCookie("refreshToken", clearRefreshCookieOptions);
  return res.json({ message: "Logged out" });
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("email name picture");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: mapUser(user) });
  } catch (error) {
    return next(error);
  }
}
