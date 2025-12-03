"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = require("../controllers/upload.controller");
const upload_1 = require("../middleware/upload");
const jwt_1 = require("../middleware/jwt");
const router = (0, express_1.Router)();
// Single image upload (requires JWT)
router.post('/image', jwt_1.requireJWT, upload_1.upload.single('image'), upload_controller_1.uploadSingleImage);
// Multiple images upload (requires JWT) - max 5 files
router.post('/images', jwt_1.requireJWT, upload_1.upload.array('images', 5), upload_controller_1.uploadMultipleImagesController);
exports.default = router;
