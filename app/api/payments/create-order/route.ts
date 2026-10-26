
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Razorpay from "razorpay";
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

    const body = await req.json();
    const plan = body?.plan;

    if (typeof plan !== "string" || !(plan in PLAN_PRICES)) {
      return NextResponse.json(
        { error: "Invalid plan selected." },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay server credentials are missing.");

      return NextResponse.json(
        { error: "Payment gateway is not configured." },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const amount = PLAN_PRICES[plan] * 100;

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `plan_${plan}_${Date.now()}`,
      notes: {
        plan,
        customerEmail: session.user.email,
      },
    });

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);

    return NextResponse.json(
      { error: "Unable to create payment order." },
      { status: 500 }
    );
  }
}
