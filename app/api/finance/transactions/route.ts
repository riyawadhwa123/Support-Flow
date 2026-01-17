import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

type NormalizedTransaction = {
  id: string;
  type: 'charge' | 'payment_intent';
  amount: number;
  currency: string;
  status: string;
  customer?: string | null;
  customer_email?: string | null;
  description?: string | null;
  created: number;
  refunded: boolean;
  captured?: boolean;
  capturable?: boolean;
  payment_intent_id?: string | null;
  charge_id?: string | null;
  receipt_url?: string | null;
  payment_method?: string | null;
  card_last4?: string | null;
};

export async function GET(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 20;

    const [charges, paymentIntents] = await Promise.all([
      stripe.charges.list({
        limit,
        expand: ['data.customer', 'data.payment_intent'],
      }),
      stripe.paymentIntents.list({
        limit,
        expand: ['data.latest_charge'],
      }),
    ]);

    const normalizedCharges: NormalizedTransaction[] = charges.data.map((charge) => ({
      id: charge.id,
      type: 'charge',
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      customer: typeof charge.customer === 'string' ? charge.customer : charge.customer?.id || null,
      customer_email: charge.billing_details?.email || null,
      description: charge.description,
      created: charge.created,
      refunded: Boolean(charge.refunded || (charge.amount_refunded ?? 0) > 0),
      captured: charge.captured,
      capturable: false,
      payment_intent_id:
        typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id || null,
      charge_id: charge.id,
      receipt_url: charge.receipt_url || null,
      payment_method: charge.payment_method_details?.type || null,
      card_last4: charge.payment_method_details?.card?.last4 || null,
    }));

    const normalizedPaymentIntents: NormalizedTransaction[] = paymentIntents.data.map((pi) => {
      const latestCharge =
        typeof pi.latest_charge === 'object' && pi.latest_charge !== null
          ? pi.latest_charge
          : null;
      const chargeRefunded = latestCharge
        ? Boolean(latestCharge.refunded || (latestCharge.amount_refunded ?? 0) > 0)
        : false;

      return {
        id: pi.id,
        type: 'payment_intent',
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        customer: typeof pi.customer === 'string' ? pi.customer : pi.customer?.id || null,
        customer_email: pi.receipt_email || (latestCharge?.billing_details?.email ?? null),
        description: pi.description,
        created: pi.created,
        refunded: chargeRefunded,
        captured: pi.status === 'succeeded' && (pi.amount_capturable ?? 0) === 0,
        capturable:
          pi.status === 'requires_capture' || Boolean(pi.amount_capturable && pi.amount_capturable > 0),
        payment_intent_id: pi.id,
        charge_id: latestCharge ? latestCharge.id : null,
        receipt_url: latestCharge?.receipt_url ?? null,
        payment_method: pi.payment_method_types?.[0] || null,
        card_last4:
          latestCharge?.payment_method_details?.card?.last4 ??
          (typeof pi.payment_method === 'object' && pi.payment_method !== null
            ? pi.payment_method.card?.last4 ?? null
            : null),
      };
    });

    // Avoid duplicate rows when a charge belongs to a payment intent by preferring the payment intent entry.
    const paymentIntentIds = new Set(
      normalizedPaymentIntents.map((pi) => pi.payment_intent_id || pi.id)
    );
    const filteredCharges = normalizedCharges.filter(
      (charge) => !charge.payment_intent_id || !paymentIntentIds.has(charge.payment_intent_id)
    );

    const merged = [...filteredCharges, ...normalizedPaymentIntents].sort(
      (a, b) => b.created - a.created
    );
    const data = merged.slice(0, limit);

    const summary = {
      total: data.length,
      succeeded: data.filter((t) => t.status === 'succeeded').length,
      refunded: data.filter((t) => t.refunded).length,
      failed: data.filter((t) => t.status === 'failed' || t.status === 'canceled').length,
      uncaptured: data.filter((t) => t.type === 'payment_intent' && t.capturable).length,
    };

    return NextResponse.json({ data, summary });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

