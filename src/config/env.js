import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT),
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
  MINIO_PORT: Number(process.env.MINIO_PORT),
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
  MINIO_BUCKET: process.env.MINIO_BUCKET,
  MINIO_USE_SSL: String(process.env.MINIO_USE_SSL).toLowerCase() === "true",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173"
};

const requiredEnvKeys = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "GOOGLE_CLIENT_ID",
  "MINIO_ENDPOINT",
  "MINIO_PORT",
  "MINIO_ACCESS_KEY",
  "MINIO_SECRET_KEY",
  "MINIO_BUCKET"
];

for (const key of requiredEnvKeys) {
  if (env[key] === undefined || env[key] === null || env[key] === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (!Number.isFinite(env.PORT) || env.PORT <= 0) {
  throw new Error("PORT must be a valid positive number");
}

if (!Number.isFinite(env.MINIO_PORT) || env.MINIO_PORT <= 0) {
  throw new Error("MINIO_PORT must be a valid positive number");
}

export default env;
