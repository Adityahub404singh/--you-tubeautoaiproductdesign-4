import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
  try {
    const { amount, plan, userId } = await req.json()

    const order = await razorpay.orders.create({
      amount: amount * 100, // paise mein
      currency: "INR",
      receipt: `order_${userId}_${Date.now()}`,
      notes: { plan, userId }
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    })

  } catch (error: any) {
    console.error("Razorpay error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
