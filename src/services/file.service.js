/**
 * ============================================================
 * FILE: src/services/file.service.js — S3 File Upload Service
 * ============================================================
 *
 * Handles file uploads for chat attachments using AWS S3.
 * Uses pre-signed URLs so the client uploads DIRECTLY to S3,
 * and our server never handles the actual file data.
 *
 * FLOW:
 *   1. Client asks our API for a pre-signed upload URL
 *   2. We generate a signed S3 URL (valid 15 min)
 *   3. Client uploads the file directly to S3
 *   4. Client sends the file key back to our API (as a message)
 *   5. When someone wants to download, we generate a pre-signed download URL
 * ============================================================
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Allowed file types (MIME) — blocks executables, scripts, etc.
const ALLOWED_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Initialize S3 client — only if credentials are configured
let s3Client = null;
if (config.aws?.accessKeyId && config.aws?.secretAccessKey) {
  s3Client = new S3Client({
    region: config.aws.region || 'ap-south-1',
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  });
}

/**
 * getUploadUrl — Generate a pre-signed URL for uploading a file to S3.
 */
async function getUploadUrl(userId, fileName, fileType, fileSize) {
  if (!s3Client) {
    throw ApiError.internal('File uploads are not configured. Set AWS credentials in .env');
  }

  // Validate file type
  if (!ALLOWED_TYPES[fileType]) {
    throw ApiError.badRequest(`File type "${fileType}" is not allowed. Allowed: ${Object.values(ALLOWED_TYPES).join(', ')}`);
  }

  // Validate file size
  if (fileSize > MAX_FILE_SIZE) {
    throw ApiError.badRequest(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
  }

  // Generate unique key — prevents name collisions and enumeration attacks
  const ext = ALLOWED_TYPES[fileType];
  const uniqueId = crypto.randomBytes(16).toString('hex');
  const key = `chat-files/${userId}/${uniqueId}${ext}`;

  const command = new PutObjectCommand({
    Bucket: config.aws.s3Bucket,
    Key: key,
    ContentType: fileType,
    ContentLength: fileSize,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes

  logger.debug(`Upload URL generated for user ${userId}: ${key}`);

  return {
    uploadUrl,
    fileKey: key,
    expiresIn: 900,
  };
}

/**
 * getDownloadUrl — Generate a pre-signed URL for downloading a file.
 */
async function getDownloadUrl(fileKey) {
  if (!s3Client) {
    throw ApiError.internal('File service not configured.');
  }

  const command = new GetObjectCommand({
    Bucket: config.aws.s3Bucket,
    Key: fileKey,
  });

  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
  return { downloadUrl, expiresIn: 3600 };
}

/**
 * deleteFile — Delete a file from S3 (admin moderation).
 */
async function deleteFile(fileKey) {
  if (!s3Client) return;

  const command = new DeleteObjectCommand({
    Bucket: config.aws.s3Bucket,
    Key: fileKey,
  });

  await s3Client.send(command);
  logger.info(`File deleted: ${fileKey}`);
}

module.exports = { getUploadUrl, getDownloadUrl, deleteFile, ALLOWED_TYPES, MAX_FILE_SIZE };
