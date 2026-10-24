import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Razorpay API credentials not configured" }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const { amount, plan, userId } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `ord_${userId || 'anon'}_${Date.now()}`,
      notes: { plan: plan || "credits", userId: userId || "" }
    });

    // Save pending payment record in DB if userId is present
    if (userId) {
      try {
        await prisma.payment.create({
          data: {
            id: order.id,
            userId,
            type: plan || "credits",
            amount: Number(amount),
            status: "pending"
          }
        });
      } catch (dbErr: any) {
        console.log("[PAYMENT DB LOG WARNING]:", dbErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId
    });

  } catch (error: any) {
    console.error("Razorpay Order Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
