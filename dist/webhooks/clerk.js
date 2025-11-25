"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhook = verifyWebhook;
exports.handleUserCreated = handleUserCreated;
exports.handleUserUpdated = handleUserUpdated;
exports.handleUserDeleted = handleUserDeleted;
const svix_1 = require("svix");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Verify Clerk webhook signature
 */
function verifyWebhook(req) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
        throw new Error('CLERK_WEBHOOK_SECRET is not set');
    }
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];
    if (!svix_id || !svix_timestamp || !svix_signature) {
        throw new Error('Missing svix headers');
    }
    const wh = new svix_1.Webhook(WEBHOOK_SECRET);
    try {
        return wh.verify(JSON.stringify(req.body), {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        });
    }
    catch (err) {
        throw new Error('Webhook verification failed');
    }
}
/**
 * Handle user.created event
 */
async function handleUserCreated(data) {
    const { id, email_addresses, first_name, last_name, username, image_url } = data;
    const primaryEmail = email_addresses.find(email => email.id === data.primary_email_address_id);
    if (!primaryEmail) {
        throw new Error('No primary email found');
    }
    try {
        const user = await prisma.user.create({
            data: {
                clerkId: id,
                email: primaryEmail.email_address,
                firstName: first_name,
                lastName: last_name,
                username,
                profileImageUrl: image_url,
            },
        });
        console.log('✅ User created:', user.id);
        return user;
    }
    catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}
/**
 * Handle user.updated event
 */
async function handleUserUpdated(data) {
    const { id, email_addresses, first_name, last_name, username, image_url } = data;
    const primaryEmail = email_addresses.find(email => email.id === data.primary_email_address_id);
    if (!primaryEmail) {
        throw new Error('No primary email found');
    }
    try {
        const user = await prisma.user.update({
            where: { clerkId: id },
            data: {
                email: primaryEmail.email_address,
                firstName: first_name,
                lastName: last_name,
                username,
                profileImageUrl: image_url,
            },
        });
        console.log('✅ User updated:', user.id);
        return user;
    }
    catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}
/**
 * Handle user.deleted event
 */
async function handleUserDeleted(data) {
    const { id } = data;
    try {
        const user = await prisma.user.delete({
            where: { clerkId: id },
        });
        console.log('✅ User deleted:', user.id);
        return user;
    }
    catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}
