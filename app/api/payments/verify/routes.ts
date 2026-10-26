
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createHmac, timingSafeEqual } from "crypto";
import Razorpay from "razorpay";
import prisma from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

const PLAN_PRICES: Record<string, number> = {
  starter: 499,
  pro: 999,
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
    } = await req.json();

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string" ||
      typeof plan !== "string" ||
      !(plan in PLAN_PRICES)
    ) {
      return NextResponse.json(
        { error: "Invalid payment details." },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Payment gateway is not configured." },
        { status: 500 }
      );
    }

    // Verify Razorpay callback signature.
    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const supplied = Buffer.from(razorpay_signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    ) {
      return NextResponse.json(
        { error: "Payment signature verification failed." },
        { status: 400 }
      );
    }

    // Verify the order and payment directly with Razorpay.
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.fetch(razorpay_order_id);
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      order.id !== razorpay_order_id ||
      order.amount !== PLAN_PRICES[plan] * 100 ||
      order.currency !== "INR" ||
      order.notes?.plan !== plan ||
      order.notes?.customerEmail !== session.user.email
    ) {
      return NextResponse.json(
        { error: "Order details do not match this account or plan." },
        { status: 400 }
      );
    }

    if (
      payment.order_id !== razorpay_order_id ||
      payment.amount !== PLAN_PRICES[plan] * 100 ||
      payment.currency !== "INR" ||
      payment.status !== "captured"
    ) {
      return NextResponse.json(
        { error: "Payment has not been captured successfully." },
        { status: 400 }
      );
    }

    // Activate only the verified plan for the logged-in account.
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account was not found." },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { plan },
    });

    return NextResponse.json({
      success: true,
      plan,
      message: "Payment verified and plan activated.",
    });
  } catch (error) {
    console.error("Payment verification failed:", error);

    return NextResponse.json(
      { error: "Unable to verify payment. Please contact support if you were charged." },
      { status: 500 }
    );
  }
}
