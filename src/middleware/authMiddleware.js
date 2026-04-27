import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing access token" });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}
