import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export const PLAN_PRICES = {
  starter: 50000, // $500 in cents
  growth: 200000, // $2,000 in cents
  enterprise: 500000, // $5,000 in cents
};

export async function createCheckoutSession(customerId: string, priceId: string) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
  });
}
