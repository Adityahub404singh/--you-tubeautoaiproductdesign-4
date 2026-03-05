import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = await req.json()

    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex")

    if (expectedSignature === razorpay_signature) {
      return NextResponse.json({ success: true, planId })
    } else {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}