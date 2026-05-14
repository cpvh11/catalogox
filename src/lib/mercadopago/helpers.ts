import { getPreferenceClient, PRO_PLAN } from "./client";

interface CreateCheckoutParams {
  userId: string;
  userEmail: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
}

export async function createProCheckout({
  userId,
  userEmail,
  successUrl,
  failureUrl,
  pendingUrl,
}: CreateCheckoutParams) {
  const preferenceClient = getPreferenceClient();

  const isProduction = process.env.NODE_ENV === "production";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const preference = await preferenceClient.create({
    body: {
      items: [
        {
          id: "pro-monthly",
          title: PRO_PLAN.title,
          description: PRO_PLAN.description,
          quantity: 1,
          unit_price: PRO_PLAN.price,
          currency_id: PRO_PLAN.currency,
        },
      ],
      payer: {
        email: userEmail,
      },
      external_reference: userId,
      statement_descriptor: "CATALOGOX PRO",
      ...(isProduction && {
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: pendingUrl,
        },
        auto_return: "approved" as const,
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
      }),
    },
  });

  return {
    preferenceId: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point,
  };
}
