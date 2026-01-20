import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleWebhookEvent, getPlanFromPriceId } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    const { success, event } = await handleWebhookEvent(payload, signature);

    if (!success || !event) {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userEmail = session.metadata?.userEmail || session.customer_email;
        const userId = session.metadata?.userId;
        
        if (userEmail && session.subscription) {
          await supabase.from('subscriptions').upsert({
            user_email: userEmail,
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan: 'pro', // Will be updated by subscription.updated event
            status: 'active',
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_email' });

          logger.info('Subscription created from checkout', {
            context: 'stripe-webhook',
            userEmail,
            metadata: { subscriptionId: session.subscription }
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const userEmail = subscription.metadata?.userEmail;
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const plan = priceId ? getPlanFromPriceId(priceId) : 'pro';

        if (userEmail) {
          await supabase.from('subscriptions').update({
            plan,
            status: subscription.status,
            current_period_start: subscription.current_period_start 
              ? new Date(subscription.current_period_start * 1000).toISOString() 
              : null,
            current_period_end: subscription.current_period_end 
              ? new Date(subscription.current_period_end * 1000).toISOString() 
              : null,
            cancel_at_period_end: subscription.cancel_at_period_end || false,
            updated_at: new Date().toISOString()
          }).eq('stripe_subscription_id', subscription.id);

          logger.info('Subscription updated', {
            context: 'stripe-webhook',
            userEmail,
            metadata: { plan, status: subscription.status }
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await supabase.from('subscriptions').update({
          plan: 'free',
          status: 'cancelled',
          updated_at: new Date().toISOString()
        }).eq('stripe_subscription_id', subscription.id);

        logger.info('Subscription cancelled', {
          context: 'stripe-webhook',
          metadata: { subscriptionId: subscription.id }
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;

        await supabase.from('subscriptions').update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        }).eq('stripe_subscription_id', subscriptionId);

        logger.warn('Payment failed', {
          context: 'stripe-webhook',
          metadata: { subscriptionId, invoiceId: invoice.id }
        });
        break;
      }

      default:
        logger.debug('Unhandled webhook event', {
          context: 'stripe-webhook',
          metadata: { type: event.type }
        });
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    logger.error('Webhook processing error', error, { context: 'stripe-webhook' });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// In Next.js App Router, request.text() already gives raw body
