import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, subject, category, priority, description, email } = body;

    // Validate required fields
    if (!ticketId || !subject || !email || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Try to save to Supabase
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.from('support_tickets').insert({
        ticket_id: ticketId,
        subject,
        category,
        priority,
        description,
        email,
        status: 'open',
        created_at: new Date().toISOString()
      });
    } catch (dbError) {
      // Log error but don't fail - ticket ID was already generated
      console.error('DB save failed:', dbError);
    }

    // Send notification email (in production, use SendGrid/Resend)
    console.log(`New ticket: ${ticketId} - ${subject} from ${email}`);

    return NextResponse.json({
      success: true,
      ticketId,
      message: 'Ticket created successfully'
    });

  } catch (error) {
    console.error('Ticket creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ tickets: tickets || [] });

  } catch (error) {
    console.error('Fetch tickets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
