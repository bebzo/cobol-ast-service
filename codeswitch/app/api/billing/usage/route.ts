import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getUserUsage, getUserSubscription } from '@/lib/usage-tracker';
import { handleApiError, ApiErrors } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      throw ApiErrors.unauthorized();
    }

    const [usage, subscription] = await Promise.all([
      getUserUsage(session.user.email),
      getUserSubscription(session.user.email)
    ]);

    return NextResponse.json({
      usage,
      subscription,
      percentUsed: {
        transpilations: Math.round((usage.transpilations / (subscription?.limits.transpilations || 10)) * 100),
        chatMessages: Math.round((usage.chatMessages / (subscription?.limits.chatMessages || 50)) * 100)
      }
    });

  } catch (error) {
    return handleApiError(error, 'billing/usage');
  }
}
