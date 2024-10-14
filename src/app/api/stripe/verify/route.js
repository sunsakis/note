import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    const session = await getServerSession(authOptions);
  
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    try {
      const { sessionId } = await req.json();
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (checkoutSession.client_reference_id !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
  
      if (checkoutSession.payment_status === 'paid') {
        const updatedUser = await prisma.user.update({
          where: { id: session.user.id },
          data: { 
            isPremium: true,
            stripeCustomerId: checkoutSession.customer
          },
        });
      
        return NextResponse.json({ 
          success: true, 
          user: {
            ...session.user,
            isPremium: updatedUser.isPremium
          }
        });
      } else {
        return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
      }
    } catch (error) {
      console.error('Error verifying subscription:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }