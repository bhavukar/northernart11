import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminSupabase } from '@/lib/supabase';
import { resend } from '@/lib/resend';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const allowedAdminEmail = process.env.ALLOWED_ADMIN_EMAIL;

    if (!webhookSecret || !allowedAdminEmail) {
      console.error('Webhook Server configuration error: Webhook secret or admin email missing.');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Razorpay signature header' },
        { status: 400 }
      );
    }

    // 1. Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('Webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    // 2. Parse payload
    const eventData = JSON.parse(rawBody);

    if (eventData.event !== 'payment.captured') {
      return NextResponse.json({ success: true, message: 'Unhandled event' });
    }

    const payment = eventData.payload?.payment?.entity;
    if (!payment) {
      return NextResponse.json(
        { error: 'Malformed webhook payload' },
        { status: 400 }
      );
    }

    // Extract transaction details and metadata from notes
    const orderId = payment.order_id;
    const paymentId = payment.id;
    const buyerEmail = payment.email;
    const buyerPhone = payment.contact;
    const notes = payment.notes || {};
    
    // Parse the array of painting IDs
    let paintingIds: string[] = [];
    try {
      paintingIds = JSON.parse(notes.paintingIds);
    } catch (e) {
      // Fallback to single ID if parsing fails
      if (notes.paintingId) {
        paintingIds = [notes.paintingId];
      }
    }

    const buyerName = notes.buyer_name || 'Collector';
    const shippingAddress = notes.shipping_address || 'Not provided';
    const paintingTitles = notes.paintingTitles || 'Artworks';

    if (paintingIds.length === 0) {
      console.error('Webhook error: No painting IDs found in notes metadata', notes);
      return NextResponse.json(
        { error: 'paintingIds missing in payment notes metadata' },
        { status: 400 }
      );
    }

    const adminSupabase = getAdminSupabase();

    // 3. Mark all purchased paintings as 'sold'
    const { error: updateError } = await adminSupabase
      .from('paintings')
      .update({ status: 'sold' })
      .in('id', paintingIds);

    if (updateError) {
      console.error('Failed to update paintings status to sold:', updateError);
      return NextResponse.json(
        { error: `Database update failed: ${updateError.message}` },
        { status: 500 }
      );
    }

    // 4. Insert order record
    const { error: orderInsertError } = await adminSupabase
      .from('orders')
      .insert({
        painting_id: paintingIds[0] || null, // backwards compatibility
        painting_ids: paintingIds, // JSON array
        order_id: orderId,
        payment_id: paymentId,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone || null,
        shipping_address: shippingAddress,
        status: 'paid',
      });

    if (orderInsertError) {
      console.error('Failed to record order details in DB:', orderInsertError);
    }

    // 5. Query details of purchased paintings to construct emails
    const { data: paintings } = await adminSupabase
      .from('paintings')
      .select('title, price, image_url')
      .in('id', paintingIds);

    const itemsListHtml = (paintings || []).map(p => `
      <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eeeeee;">
        <img src="${p.image_url}" alt="${p.title}" style="width: 60px; height: 60px; object-cover: cover; background-color: #fafafa;" />
        <div>
          <h4 style="margin: 0; font-family: Georgia, serif; font-size: 14px; font-weight: normal;">"${p.title}"</h4>
          <p style="margin: 3px 0 0 0; font-size: 12px; color: #666666;">${(p.price / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</p>
        </div>
      </div>
    `).join('');

    const totalPaidAmount = (payment.amount / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });

    // 6. Send Transactional Emails
    // Buyer Receipt Email
    try {
      await resend.emails.send({
        from: 'northernart11 <onboarding@resend.dev>',
        to: buyerEmail,
        subject: `Acquisition Confirmed: ${paintingTitles}`,
        html: `
          <div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; color: #111111; border: 1px solid #f0f0f0;">
            <h1 style="font-size: 24px; font-weight: normal; margin-bottom: 24px; text-align: center; letter-spacing: 0.05em;">northernart11</h1>
            <div style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #444444;">
              <p>Dear ${buyerName},</p>
              <p>Thank you for acquiring new artwork from the gallery. We are pleased to confirm that your transaction has been processed successfully.</p>
              
              <div style="margin: 30px 0;">
                <p style="margin: 0 0 10px 0; font-weight: bold;">Acquired Piece(s):</p>
                ${itemsListHtml}
              </div>
              
              <div style="border-top: 1px solid #eeeeee; border-bottom: 1px solid #eeeeee; padding: 15px 0; margin: 20px 0; font-size: 13px;">
                <p style="margin: 4px 0;">Total Investment: <strong>${totalPaidAmount}</strong></p>
                <p style="margin: 4px 0;">Order Reference: ${orderId}</p>
                <p style="margin: 4px 0;">Payment Reference: ${paymentId}</p>
              </div>

              <p>The artist has been notified and is preparing the packaging to ensure the artwork arrives safely at your destination:</p>
              <blockquote style="margin: 20px 0; padding: 15px; border-left: 2px solid #111111; font-style: italic; color: #666666; background-color: #fafafa;">
                ${shippingAddress.replace(/\n/g, '<br/>')}
              </blockquote>
              
              <p>We will send a tracking link as soon as the shipping carrier dispatches the crate.</p>
              <p style="margin-top: 40px; font-size: 11px; color: #999999;">If you have questions regarding the custom framing or shipping timeline, reply to this email to contact the studio.</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send buyer receipt email:', emailError);
    }

    // Artist Alert Email
    try {
      await resend.emails.send({
        from: 'northernart11 <onboarding@resend.dev>',
        to: allowedAdminEmail,
        subject: `New Acquisition Alert: ${paintingIds.length} Piece(s) Sold`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; color: #111111; border: 1px solid #f0f0f0;">
            <h2 style="font-family: Georgia, serif; font-weight: normal; margin-bottom: 20px; border-bottom: 1px solid #111111; padding-bottom: 10px;">New Acquisition Alert</h2>
            <div style="font-size: 14px; line-height: 1.6; color: #333333;">
              <p>Congratulations, the following piece(s) have been purchased:</p>
              
              <div style="margin: 20px 0;">
                ${itemsListHtml}
              </div>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f0f0f0; width: 140px;">Total Price:</td>
                  <td style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;">${totalPaidAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f0f0f0;">Collector Name:</td>
                  <td style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;">${buyerName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f0f0f0;">Email:</td>
                  <td style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;"><a href="mailto:${buyerEmail}">${buyerEmail}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f0f0f0;">Contact Number:</td>
                  <td style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;">${buyerPhone || 'Not provided'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; border-bottom: 1px solid #f0f0f0; vertical-align: top;">Shipping Address:</td>
                  <td style="padding: 10px; border: 1px solid #eaeaea; background-color: #fafafa; font-family: monospace; white-space: pre-wrap;">${shippingAddress}</td>
                </tr>
              </table>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send artist notification email:', emailError);
    }

    return NextResponse.json({ success: true, message: 'Payment recorded and notifications dispatched' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server processing error' },
      { status: 500 }
    );
  }
}
