"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleImages = exports.deleteImage = exports.uploadImage = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const stream_1 = require("stream");
/**
 * Upload image to Cloudinary
 * @param fileBuffer - Buffer containing the file data
 * @param folder - Folder name in Cloudinary
 * @param filename - Optional filename
 * @returns Promise with upload result containing URL and public ID
 */
const uploadImage = async (fileBuffer, folder, filename) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.uploader.upload_stream({
            folder: `driver24/${folder}`,
            public_id: filename,
            resource_type: 'auto',
            transformation: [
                { width: 1000, crop: 'limit' },
                { quality: 'auto:good' }
            ]
        }, (error, result) => {
            if (error) {
                console.error('Cloudinary upload error:', error);
                reject(error);
            }
            else if (result) {
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id
                });
            }
            else {
                reject(new Error('Upload failed - no result returned'));
            }
        });
        const readableStream = stream_1.Readable.from(fileBuffer);
        readableStream.pipe(uploadStream);
    });
};
exports.uploadImage = uploadImage;
/**
 * Delete image from Cloudinary
 * @param publicId - Public ID of the image to delete
 */
const deleteImage = async (publicId) => {
    try {
        await cloudinary_1.default.uploader.destroy(publicId);
        console.log(`✅ Deleted image: ${publicId}`);
    }
    catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
};
exports.deleteImage = deleteImage;
/**
 * Upload multiple images to Cloudinary
 * @param files - Array of file buffers with metadata
 * @param folder - Folder name in Cloudinary
 * @returns Promise with array of upload results
 */
const uploadMultipleImages = async (files, folder) => {
    const uploadPromises = files.map((file) => (0, exports.uploadImage)(file.buffer, folder, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`));
    return Promise.all(uploadPromises);
};
exports.uploadMultipleImages = uploadMultipleImages;
