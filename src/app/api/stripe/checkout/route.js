import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  const session = await getServerSession(authOptions);
  const { articleUrl } = await req.json();  // Get the article URL from the request body

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/success?session_id={CHECKOUT_SESSION_ID}&article_url=${encodeURIComponent(articleUrl)}`,
      cancel_url: `${process.env.NEXTAUTH_URL}${articleUrl}`,
      client_reference_id: session.user.id,
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}