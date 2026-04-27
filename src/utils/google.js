import axios from "axios";
import env from "../config/env.js";

export async function verifyGoogleCredential(credential) {
  if (!credential) {
    throw new Error("Google credential is required");
  }

  const response = await axios.get("https://oauth2.googleapis.com/tokeninfo", {
    params: { id_token: credential },
    timeout: 7000
  });

  const payload = response.data;

  if (payload.aud !== env.GOOGLE_CLIENT_ID) {
    throw new Error("Invalid Google audience");
  }

  if (payload.email_verified !== "true") {
    throw new Error("Google email is not verified");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture || ""
  };
}
