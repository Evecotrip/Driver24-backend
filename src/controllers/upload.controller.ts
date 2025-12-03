import { Request, Response } from 'express';
import { uploadImage, uploadMultipleImages } from '../services/upload.service';
import { AuthRequest } from '../middleware/jwt';

/**
 * Upload single image
 * POST /api/upload/image
 */
export const uploadSingleImage = async (req: AuthRequest, res: Response): Promise<void> => {
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
        const result = await uploadImage(
            req.file.buffer,
            folder,
            `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`
        );

        res.json({
            success: true,
            data: {
                url: result.url,
                publicId: result.publicId
            },
            message: 'Image uploaded successfully'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload image'
        });
    }
};

/**
 * Upload multiple images
 * POST /api/upload/images
 */
export const uploadMultipleImagesController = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const files = req.files as Express.Multer.File[];

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
        const results = await uploadMultipleImages(files, folder);

        res.json({
            success: true,
            data: results,
            message: `${results.length} image(s) uploaded successfully`
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload images'
        });
    }
};
