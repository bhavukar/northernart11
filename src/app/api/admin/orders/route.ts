import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminSupabase = getAdminSupabase();

    // Query orders and join with paintings to display title and image
    const { data: orders, error } = await adminSupabase
      .from('orders')
      .select(`
        id,
        order_id,
        payment_id,
        buyer_name,
        buyer_email,
        buyer_phone,
        shipping_address,
        status,
        created_at,
        paintings (
          title,
          image_url,
          price
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch orders error:', error);
      return NextResponse.json(
        { error: `Failed to retrieve orders: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Fetch orders API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
