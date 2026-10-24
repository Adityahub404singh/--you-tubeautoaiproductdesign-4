import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Razorpay Secret Key missing" }, { status: 500 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      plan = "pro",
      credits = 10,
      amount = 0
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment signature details" }, { status: 400 });
    }

    // 1. Verify HMAC Signature
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // Mark payment as failed in DB if present
      if (razorpay_order_id) {
        await prisma.payment.updateMany({
          where: { id: razorpay_order_id },
          data: { status: "failed" }
        }).catch(() => {});
      }
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // 2. Add Credits & Update User Plan in Database
    if (userId) {
      const addedCredits = Number(credits) || 10;
      const addedAmount = Number(amount) || 0;

      await prisma.user.update({
        where: { id: userId },
        data: {
          paidVideoCredits: { increment: addedCredits },
          totalSpent: { increment: addedAmount },
          plan: plan || "pro"
        }
      });

      // Update or Upsert Payment Record Status
      await prisma.payment.upsert({
        where: { id: razorpay_order_id },
        update: { status: "success", amount: addedAmount },
        create: {
          id: razorpay_order_id,
          userId,
          type: plan || "credits",
          amount: addedAmount,
          status: "success"
        }
      });

      // Log transaction in Credit Ledger
      await prisma.creditLedger.create({
        data: {
          userId,
          amount: addedCredits,
          type: "PURCHASE",
          description: `Purchased ${addedCredits} credits via Razorpay (${razorpay_payment_id})`
        }
      }).catch((e: any) => console.log("[LEDGER WARNING]:", e.message));

      console.log(`? Payment Verified! Credited ${addedCredits} credits to user ${userId}`);
    }

    return NextResponse.json({
      success: true,
      userId,
      plan,
      credits,
      paymentId: razorpay_payment_id
    });

  } catch (error: any) {
    console.error("Payment Verification Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
