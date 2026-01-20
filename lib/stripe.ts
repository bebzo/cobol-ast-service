/**
 * Stripe Integration for CodeSwitch
 * Handles subscriptions and billing
 */

import Stripe from 'stripe';
import { logger } from './logger';

// Initialize Stripe (only if key is available)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2025-12-15.clover' }) : null;

// Price IDs (configure in Stripe Dashboard)
export const PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
  enterprise_yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
};

export interface CreateCheckoutParams {
  userEmail: string;
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create a Stripe Checkout Session
 */
export async function createCheckoutSession(params: CreateCheckoutParams): Promise<string | null> {
  if (!stripe) {
    logger.warn('Stripe not configured', { context: 'stripe' });
    return null;
  }

  try {
    // Find or create customer
    let customer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({ email: params.userEmail, limit: 1 });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: params.userEmail,
        metadata: { userId: params.userId }
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price: params.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        userId: params.userId,
        userEmail: params.userEmail
      },
      subscription_data: {
        metadata: {
          userId: params.userId,
          userEmail: params.userEmail
        }
      }
    });

    logger.info('Checkout session created', {
      context: 'stripe',
      userEmail: params.userEmail,
      metadata: { sessionId: session.id }
    });

    return session.url;
  } catch (error) {
    logger.error('Failed to create checkout session', error, { context: 'stripe' });
    throw error;
  }
}

/**
 * Create a billing portal session for subscription management
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string | null> {
  if (!stripe) {
    logger.warn('Stripe not configured', { context: 'stripe' });
    return null;
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error) {
    logger.error('Failed to create billing portal session', error, { context: 'stripe' });
    throw error;
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  if (!stripe) return null;

  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    logger.error('Failed to get subscription', error, { context: 'stripe' });
    return null;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  if (!stripe) return false;

  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
    
    logger.info('Subscription cancelled', {
      context: 'stripe',
      metadata: { subscriptionId }
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to cancel subscription', error, { context: 'stripe' });
    return false;
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(
  payload: string,
  signature: string
): Promise<{ success: boolean; event?: Stripe.Event }> {
  if (!stripe) {
    return { success: false };
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.warn('Stripe webhook secret not configured', { context: 'stripe' });
    return { success: false };
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    
    logger.info('Webhook event received', {
      context: 'stripe',
      metadata: { type: event.type, id: event.id }
    });
    
    return { success: true, event };
  } catch (error) {
    logger.error('Webhook signature verification failed', error, { context: 'stripe' });
    return { success: false };
  }
}

/**
 * Map Stripe price ID to plan name
 */
export function getPlanFromPriceId(priceId: string): string {
  if (priceId.includes('enterprise')) return 'enterprise';
  if (priceId.includes('pro')) return 'pro';
  return 'free';
}
