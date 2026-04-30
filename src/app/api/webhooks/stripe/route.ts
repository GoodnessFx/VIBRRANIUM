import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;
    
    // Find protocol by customerId or custom field
    // For now, update the protocol with the subscription info
    await prisma.protocol.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        stripeSubscriptionId: subscriptionId,
        monitoringActive: true,
      },
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const subscriptionId = session.id;
    await prisma.protocol.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        monitoringActive: false,
      },
    });
  }

  return new Response(null, { status: 200 });
}
