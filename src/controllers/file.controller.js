/**
 * ============================================================
 * FILE: src/controllers/file.controller.js — File Upload Handlers
 * ============================================================
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const fileService = require('../services/file.service');

const getUploadUrl = asyncHandler(async (req, res) => {
  const { fileName, fileType, fileSize } = req.body;
  const result = await fileService.getUploadUrl(req.user.id, fileName, fileType, fileSize);
  res.json(ApiResponse.success(result, 'Upload URL generated'));
});

const getDownloadUrl = asyncHandler(async (req, res) => {
  const { fileKey } = req.query;
  const result = await fileService.getDownloadUrl(fileKey);
  res.json(ApiResponse.success(result));
});

module.exports = { getUploadUrl, getDownloadUrl };
