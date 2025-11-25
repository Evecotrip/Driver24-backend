import { Router } from 'express';
import { handleClerkWebhook } from '../controllers/webhook.controller';

const router = Router();

// Clerk webhook endpoint
router.post('/clerk', handleClerkWebhook);

export default router;
