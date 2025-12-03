"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleImagesController = exports.uploadSingleImage = void 0;
const upload_service_1 = require("../services/upload.service");
/**
 * Upload single image
 * POST /api/upload/image
 */
const uploadSingleImage = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
            return;
        }
        const { folder } = req.body;
        if (!folder) {
            res.status(400).json({
                success: false,
                error: 'Folder name is required'
            });
            return;
        }
        // Upload to Cloudinary
        const result = await (0, upload_service_1.uploadImage)(req.file.buffer, folder, `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`);
        res.json({
            success: true,
            data: {
                url: result.url,
                publicId: result.publicId
            },
            message: 'Image uploaded successfully'
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload image'
        });
    }
};
exports.uploadSingleImage = uploadSingleImage;
/**
 * Upload multiple images
 * POST /api/upload/images
 */
const uploadMultipleImagesController = async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({
                success: false,
                error: 'No files uploaded'
            });
            return;
        }
        const { folder } = req.body;
        if (!folder) {
            res.status(400).json({
                success: false,
                error: 'Folder name is required'
            });
            return;
        }
        // Upload all files
        const results = await (0, upload_service_1.uploadMultipleImages)(files, folder);
        res.json({
            success: true,
            data: results,
            message: `${results.length} image(s) uploaded successfully`
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload images'
        });
    }
};
exports.uploadMultipleImagesController = uploadMultipleImagesController;
