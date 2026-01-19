import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createCheckoutSession, PRICE_IDS } from '@/lib/stripe';
import { handleApiError, ApiErrors } from '@/lib/api-error';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      throw ApiErrors.unauthorized();
    }

    const body = await request.json();
    const { plan, interval } = body;

    // Validate plan
    if (!['pro', 'enterprise'].includes(plan)) {
      throw ApiErrors.badRequest('Invalid plan selected');
    }

    // Get price ID
    const priceKey = `${plan}_${interval || 'monthly'}` as keyof typeof PRICE_IDS;
    const priceId = PRICE_IDS[priceKey];

    if (!priceId) {
      throw ApiErrors.badRequest('Invalid plan configuration');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cobol-ast-service.vercel.app';
    
    const checkoutUrl = await createCheckoutSession({
      userEmail: session.user.email,
      userId: (session.user as any).id || session.user.email,
      priceId,
      successUrl: `${baseUrl}/dashboard?checkout=success`,
      cancelUrl: `${baseUrl}/pricing?checkout=cancelled`
    });

    if (!checkoutUrl) {
      throw ApiErrors.serviceUnavailable();
    }

    logger.info('Checkout initiated', {
      context: 'billing',
      userEmail: session.user.email,
      metadata: { plan, interval }
    });

    return NextResponse.json({ url: checkoutUrl });

  } catch (error) {
    return handleApiError(error, 'billing/checkout');
  }
}
