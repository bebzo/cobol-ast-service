/**
 * Usage Tracker for CodeSwitch
 * Logs API usage for billing and analytics
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type UsageAction = 'transpile' | 'analyse' | 'chat' | 'export' | 'test_generation';

interface UsageEntry {
  user_email: string;
  user_id?: string;
  action: UsageAction;
  tokens_used?: number;
  lines_processed?: number;
  success: boolean;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
}

// Plan limits (per month)
export const PLAN_LIMITS: Record<string, { transpilations: number; chatMessages: number; linesPerFile: number }> = {
  free: { transpilations: 10, chatMessages: 50, linesPerFile: 500 },
  pro: { transpilations: 100, chatMessages: 500, linesPerFile: 5000 },
  enterprise: { transpilations: Infinity, chatMessages: Infinity, linesPerFile: Infinity }
};

/**
 * Track API usage
 */
export async function trackUsage(entry: UsageEntry): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    await supabase.from('usage_logs').insert({
      user_email: entry.user_email,
      user_id: entry.user_id,
      action: entry.action,
      tokens_used: entry.tokens_used || 0,
      lines_processed: entry.lines_processed || 0,
      success: entry.success,
      error_message: entry.error_message,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    // Don't fail the request if usage tracking fails
    logger.warn('Failed to track usage', { 
      context: 'usage-tracker',
      metadata: { error: String(error), entry }
    });
  }
}

/**
 * Get user's usage for current month
 */
export async function getUserUsage(userEmail: string): Promise<{
  transpilations: number;
  chatMessages: number;
  totalLines: number;
}> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get first day of current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const { data, error } = await supabase
      .from('usage_logs')
      .select('action, lines_processed')
      .eq('user_email', userEmail)
      .eq('success', true)
      .gte('created_at', firstDayOfMonth);
    
    if (error) throw error;
    
    const usage = (data || []).reduce((acc, log) => {
      if (log.action === 'transpile' || log.action === 'analyse') {
        acc.transpilations++;
        acc.totalLines += log.lines_processed || 0;
      } else if (log.action === 'chat') {
        acc.chatMessages++;
      }
      return acc;
    }, { transpilations: 0, chatMessages: 0, totalLines: 0 });
    
    return usage;
  } catch (error) {
    logger.error('Failed to get user usage', error, { context: 'usage-tracker' });
    return { transpilations: 0, chatMessages: 0, totalLines: 0 };
  }
}

/**
 * Check if user has exceeded their plan limits
 */
export async function checkUsageLimits(
  userEmail: string, 
  action: UsageAction,
  linesCount?: number
): Promise<{ allowed: boolean; reason?: string; usage?: any }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_email', userEmail)
      .single();
    
    const plan = subscription?.plan || 'free';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
    
    // Get current usage
    const usage = await getUserUsage(userEmail);
    
    // Check limits
    if (action === 'transpile' || action === 'analyse') {
      if (usage.transpilations >= limits.transpilations) {
        return {
          allowed: false,
          reason: `Monthly transpilation limit reached (${limits.transpilations}). Upgrade your plan for more.`,
          usage
        };
      }
      
      if (linesCount && linesCount > limits.linesPerFile) {
        return {
          allowed: false,
          reason: `File too large (${linesCount} lines). ${plan === 'free' ? 'Free plan' : 'Your plan'} allows up to ${limits.linesPerFile} lines per file.`,
          usage
        };
      }
    }
    
    if (action === 'chat' && usage.chatMessages >= limits.chatMessages) {
      return {
        allowed: false,
        reason: `Monthly chat message limit reached (${limits.chatMessages}). Upgrade your plan for more.`,
        usage
      };
    }
    
    return { allowed: true, usage };
  } catch (error) {
    logger.warn('Failed to check usage limits, allowing request', { 
      context: 'usage-tracker',
      metadata: { error: String(error) }
    });
    // Allow request if we can't check limits
    return { allowed: true };
  }
}

/**
 * Get user's subscription info
 */
export async function getUserSubscription(userEmail: string): Promise<{
  plan: string;
  status: string;
  limits: typeof PLAN_LIMITS['free'];
} | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_email', userEmail)
      .single();
    
    const plan = subscription?.plan || 'free';
    
    return {
      plan,
      status: subscription?.status || 'active',
      limits: PLAN_LIMITS[plan] || PLAN_LIMITS.free
    };
  } catch (error) {
    return {
      plan: 'free',
      status: 'active',
      limits: PLAN_LIMITS.free
    };
  }
}
