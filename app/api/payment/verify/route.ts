import crypto from "crypto"

export async function POST(req: Request) {

  const body = await req.json()

  const { order_id, payment_id, signature } = body

  const generated = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(order_id + "|" + payment_id)
    .digest("hex")

  if (generated === signature) {
    return Response.json({ success: true })
  }

  return Response.json({ success: false })
}