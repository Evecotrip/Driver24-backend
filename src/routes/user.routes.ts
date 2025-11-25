import { Router } from 'express';
import { getAllUsers, getCurrentUser, getUserById } from '../controllers/user.controller';
import { requireAuth } from '../middleware/clerk';

const router = Router();

// All user routes require authentication
router.get('/', requireAuth, getAllUsers);
router.get('/me', requireAuth, getCurrentUser);
router.get('/:id', requireAuth, getUserById);

export default router;
