/**
 * ============================================================
 * FILE: src/routes/file.routes.js
 * ============================================================
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const fileController = require('../controllers/file.controller');

router.use(authenticate);

router.post('/upload-url', fileController.getUploadUrl);
router.get('/download-url', fileController.getDownloadUrl);

module.exports = router;
