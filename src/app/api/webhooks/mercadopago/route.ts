import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getPaymentClient } from "@/lib/mercadopago/client";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-signature");
    const requestId = request.headers.get("x-request-id");

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const parts = signature.split(",");
      let ts = "";
      let v1 = "";

      for (const part of parts) {
        const [key, value] = part.split("=");
        if (key === "ts") ts = value;
        if (key === "v1") v1 = value;
      }

      const manifest = `id:${requestId};request-id:${requestId};ts:${ts};`;
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(manifest)
        .digest("hex");

      if (v1 !== expectedSignature) {
        console.error("Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const data = JSON.parse(body);
    console.log("MercadoPago webhook received:", data.type, data.action);

    if (data.type === "payment") {
      const paymentId = data.data?.id;

      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      const paymentClient = getPaymentClient();
      const payment = await paymentClient.get({ id: paymentId });

      if (payment.status === "approved") {
        const userId = payment.external_reference;

        if (userId) {
          const supabase = await createServiceClient();

          await supabase
            .from("profiles")
            .update({
              plan: "pro",
              mp_customer_id: payment.payer?.id?.toString() || null,
            })
            .eq("id", userId);

          console.log(`User ${userId} upgraded to Pro`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "MercadoPago webhook endpoint" });
}
