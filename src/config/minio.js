import { Client } from "minio";
import env from "./env.js";

const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY
});

const bucketName = env.MINIO_BUCKET;

export async function ensureBucketExists() {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName);
  }
}

export async function uploadEncryptedBuffer({ objectKey, buffer, contentType = "application/octet-stream" }) {
  await minioClient.putObject(bucketName, objectKey, buffer, buffer.length, {
    "Content-Type": contentType
  });
}

export function getObjectUrl(objectKey) {
  const protocol = env.MINIO_USE_SSL ? "https" : "http";
  return `${protocol}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${bucketName}/${objectKey}`;
}

export async function getSignedObjectUrl(objectKey, expirySeconds = 3600) {
  return minioClient.presignedGetObject(bucketName, objectKey, expirySeconds);
}

export async function getObjectStream(objectKey) {
  return minioClient.getObject(bucketName, objectKey);
}
