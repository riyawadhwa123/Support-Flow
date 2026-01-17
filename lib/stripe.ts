import Stripe from 'stripe';

// Initialize Stripe client
// Use the API version that matches the installed Stripe SDK typings
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

/**
 * Find a customer by customer ID or email
 */
export async function findCustomerByIdentifier(identifier: string): Promise<Stripe.Customer | null> {
  try {
    // Try to find by customer ID first
    if (identifier.startsWith('cus_')) {
      const customer = await stripe.customers.retrieve(identifier);
      if (!customer.deleted) {
        return customer as Stripe.Customer;
      }
    }

    // Try to find by email
    const customers = await stripe.customers.search({
      query: `email:'${identifier}'`,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    return null;
  } catch (error) {
    console.error('Error finding customer:', error);
    return null;
  }
}

/**
 * Find a payment intent or charge by order number or payment intent ID
 */
export async function findPaymentByIdentifier(identifier: string): Promise<{
  paymentIntent?: Stripe.PaymentIntent;
  charge?: Stripe.Charge;
  customerId?: string;
} | null> {
  try {
    // Try to find by payment intent ID
    if (identifier.startsWith('pi_')) {
      const paymentIntent = await stripe.paymentIntents.retrieve(identifier);
      return {
        paymentIntent,
        customerId: typeof paymentIntent.customer === 'string' 
          ? paymentIntent.customer 
          : paymentIntent.customer?.id,
      };
    }

    // Try to find by charge ID
    if (identifier.startsWith('ch_')) {
      const charge = await stripe.charges.retrieve(identifier);
      return {
        charge,
        customerId: typeof charge.customer === 'string' 
          ? charge.customer 
          : charge.customer?.id,
      };
    }

    // Try to find by payment intent metadata (order number)
    const paymentIntents = await stripe.paymentIntents.search({
      query: `metadata['order_number']:'${identifier}'`,
      limit: 1,
    });

    if (paymentIntents.data.length > 0) {
      const paymentIntent = paymentIntents.data[0];
      return {
        paymentIntent,
        customerId: typeof paymentIntent.customer === 'string' 
          ? paymentIntent.customer 
          : paymentIntent.customer?.id,
      };
    }

    // Try to find by charge metadata (order number)
    const charges = await stripe.charges.search({
      query: `metadata['order_number']:'${identifier}'`,
      limit: 1,
    });

    if (charges.data.length > 0) {
      const charge = charges.data[0];
      return {
        charge,
        customerId: typeof charge.customer === 'string' 
          ? charge.customer 
          : charge.customer?.id,
      };
    }

    return null;
  } catch (error) {
    console.error('Error finding payment:', error);
    return null;
  }
}

/**
 * Get customer's recent payments/charges
 */
export async function getCustomerPayments(customerId: string, limit: number = 10) {
  try {
    const charges = await stripe.charges.list({
      customer: customerId,
      limit,
    });

    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit,
    });

    return {
      charges: charges.data,
      paymentIntents: paymentIntents.data,
    };
  } catch (error) {
    console.error('Error getting customer payments:', error);
    return { charges: [], paymentIntents: [] };
  }
}

