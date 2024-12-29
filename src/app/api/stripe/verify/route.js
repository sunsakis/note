// src/app/api/stripe/verify/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth" 
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const CREDITS_PER_PURCHASE = 30;

export async function POST(req) {
    const session = await getServerSession(authOptions);
  
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    try {
      const { sessionId } = await req.json();
      
      if (!sessionId) {
        return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
      }

      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (checkoutSession.client_reference_id !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
  
      if (checkoutSession.payment_status === 'paid') {
        // Check for existing payment verification
        const existingPayment = await prisma.paymentVerification.findUnique({
          where: { 
            sessionId: sessionId 
          }
        });

        if (existingPayment) {
          console.log('Payment already processed:', existingPayment);
          return NextResponse.json({ 
            error: 'Payment already processed',
            user: session.user
          }, { status: 400 });
        }

        // Process new payment
        const updatedUser = await prisma.$transaction(async (tx) => {
          // Create payment verification record
          await tx.paymentVerification.create({
            data: {
              sessionId: sessionId,
              userId: session.user.id,
              amount: CREDITS_PER_PURCHASE,
              stripeCustomerId: checkoutSession.customer
            }
          });

          // Update user credits
          return tx.user.update({
            where: { 
              id: session.user.id 
            },
            data: { 
              credits: {
                increment: CREDITS_PER_PURCHASE
              },
              stripeCustomerId: checkoutSession.customer
            },
          });
        });

        console.log('Successfully updated user credits:', updatedUser);
      
        return NextResponse.json({ 
          success: true, 
          user: {
            ...session.user,
            credits: updatedUser.credits
          }
        });
      } else {
        console.log('Payment not completed:', checkoutSession.payment_status);
        return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
      }
    } catch (error) {
      console.error('Error verifying credit purchase:', error);
      return NextResponse.json({ 
        error: 'Error processing payment verification',
        message: error.message
      }, { status: 500 });
    }
}