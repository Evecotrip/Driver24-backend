import { Router } from 'express';
import { uploadSingleImage, uploadMultipleImagesController } from '../controllers/upload.controller';
import { upload } from '../middleware/upload';
import { requireJWT } from '../middleware/jwt';

const router = Router();

// Single image upload (requires JWT)
router.post('/image', requireJWT, upload.single('image'), uploadSingleImage);

// Multiple images upload (requires JWT) - max 5 files
router.post('/images', requireJWT, upload.array('images', 5), uploadMultipleImagesController);

export default router;
