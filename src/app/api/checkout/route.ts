import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { razorpay } from '@/lib/razorpay';

export async function POST(request: Request) {
  try {
    const { paintingIds } = await request.json();

    if (!paintingIds || !Array.isArray(paintingIds) || paintingIds.length === 0) {
      return NextResponse.json(
        { error: 'An array of painting IDs is required' },
        { status: 400 }
      );
    }

    // 1. Fetch painting details for all requested IDs
    const { data: paintings, error: dbError } = await supabase
      .from('paintings')
      .select('id, title, price, status')
      .in('id', paintingIds);

    if (dbError || !paintings) {
      console.error('Checkout error fetching paintings:', dbError);
      return NextResponse.json(
        { error: 'One or more artworks could not be found' },
        { status: 404 }
      );
    }

    // Confirm that all paintings were successfully retrieved
    if (paintings.length !== paintingIds.length) {
      return NextResponse.json(
        { error: 'Some requested artworks are invalid or no longer exist' },
        { status: 404 }
      );
    }

    // 2. Verify that ALL selected paintings are available
    const unavailablePaintings = paintings.filter(p => p.status !== 'available');
    if (unavailablePaintings.length > 0) {
      const titles = unavailablePaintings.map(p => `"${p.title}"`).join(', ');
      return NextResponse.json(
        { error: `The following artwork(s) have already been sold: ${titles}` },
        { status: 400 }
      );
    }

    // 3. Compute total price in paise (integer)
    const totalAmount = paintings.reduce((sum, p) => sum + Number(p.price), 0);

    // 4. Create a single integrated Razorpay Order
    const options = {
      amount: totalAmount,
      currency: 'INR',
      receipt: paintingIds[0], // Reference to first item as receipt root
      notes: {
        paintingIds: JSON.stringify(paintingIds),
        paintingTitles: paintings.map(p => p.title).join(', '),
      },
    };

    try {
      const order = await razorpay.orders.create(options);
      
      return NextResponse.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      });
    } catch (rzpError: any) {
      console.error('Razorpay Order creation failed:', rzpError);
      return NextResponse.json(
        { error: 'Failed to initiate payment gateway order' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { error: 'An unexpected checkout error occurred' },
      { status: 500 }
    );
  }
}
