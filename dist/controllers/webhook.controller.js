"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleClerkWebhook = void 0;
const clerk_1 = require("../webhooks/clerk");
/**
 * Handle Clerk webhook events
 */
const handleClerkWebhook = async (req, res) => {
    try {
        console.log('📨 Webhook endpoint hit!');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        // Verify webhook signature
        const payload = (0, clerk_1.verifyWebhook)(req);
        const { type, data } = payload;
        console.log(`✅ Webhook verified: ${type}`);
        // Handle different event types
        switch (type) {
            case 'user.created':
                await (0, clerk_1.handleUserCreated)(data);
                console.log('✅ User created successfully');
                break;
            case 'user.updated':
                await (0, clerk_1.handleUserUpdated)(data);
                console.log('✅ User updated successfully');
                break;
            case 'user.deleted':
                await (0, clerk_1.handleUserDeleted)(data);
                console.log('✅ User deleted successfully');
                break;
            default:
                console.log(`⚠️ Unhandled event type: ${type}`);
        }
        res.json({ success: true, message: 'Webhook processed' });
    }
    catch (error) {
        console.error('❌ Webhook error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ success: false, error: errorMessage });
    }
};
exports.handleClerkWebhook = handleClerkWebhook;
