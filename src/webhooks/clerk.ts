import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/express';
import { prisma } from '../lib/prisma';

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUserData {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  image_url: string;
}

interface ClerkDeletedData {
  id: string;
}

/**
 * Verify Clerk webhook signature
 */
export function verifyWebhook(req: Request): unknown {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET is not set');
  }

  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    throw new Error('Missing svix headers');
  }

  const wh = new Webhook(WEBHOOK_SECRET);

  try {
    return wh.verify(JSON.stringify(req.body), {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    throw new Error('Webhook verification failed');
  }
}

/**
 * Handle user.created event
 */
export async function handleUserCreated(data: ClerkUserData) {
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
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Handle user.updated event
 */
export async function handleUserUpdated(data: ClerkUserData) {
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
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Handle user.deleted event
 */
export async function handleUserDeleted(data: ClerkDeletedData) {
  const { id } = data;

  try {
    const user = await prisma.user.delete({
      where: { clerkId: id },
    });

    console.log('✅ User deleted:', user.id);
    return user;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}
