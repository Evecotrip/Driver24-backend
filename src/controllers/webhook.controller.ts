import { Request, Response } from 'express';
import { verifyWebhook, handleUserCreated, handleUserUpdated, handleUserDeleted } from '../webhooks/clerk';

/**
 * Handle Clerk webhook events
 */
export const handleClerkWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📨 Webhook endpoint hit!');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Verify webhook signature
    const payload = verifyWebhook(req);
    const { type, data } = payload as { type: string; data: any };

    console.log(`✅ Webhook verified: ${type}`);

    // Handle different event types
    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        console.log('✅ User created successfully');
        break;
      
      case 'user.updated':
        await handleUserUpdated(data);
        console.log('✅ User updated successfully');
        break;
      
      case 'user.deleted':
        await handleUserDeleted(data);
        console.log('✅ User deleted successfully');
        break;
      
      default:
        console.log(`⚠️ Unhandled event type: ${type}`);
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: errorMessage });
  }
};
