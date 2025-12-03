import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

export interface UploadResult {
    url: string;
    publicId: string;
}

/**
 * Upload image to Cloudinary
 * @param fileBuffer - Buffer containing the file data
 * @param folder - Folder name in Cloudinary
 * @param filename - Optional filename
 * @returns Promise with upload result containing URL and public ID
 */
export const uploadImage = async (
    fileBuffer: Buffer,
    folder: string,
    filename?: string
): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `driver24/${folder}`,
                public_id: filename,
                resource_type: 'auto',
                transformation: [
                    { width: 1000, crop: 'limit' },
                    { quality: 'auto:good' }
                ]
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                } else if (result) {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id
                    });
                } else {
                    reject(new Error('Upload failed - no result returned'));
                }
            }
        );

        const readableStream = Readable.from(fileBuffer);
        readableStream.pipe(uploadStream);
    });
};

/**
 * Delete image from Cloudinary
 * @param publicId - Public ID of the image to delete
 */
export const deleteImage = async (publicId: string): Promise<void> => {
    try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`✅ Deleted image: ${publicId}`);
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
};

/**
 * Upload multiple images to Cloudinary
 * @param files - Array of file buffers with metadata
 * @param folder - Folder name in Cloudinary
 * @returns Promise with array of upload results
 */
export const uploadMultipleImages = async (
    files: Array<{ buffer: Buffer; originalname: string }>,
    folder: string
): Promise<UploadResult[]> => {
    const uploadPromises = files.map((file) =>
        uploadImage(
            file.buffer,
            folder,
            `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`
        )
    );

    return Promise.all(uploadPromises);
};
