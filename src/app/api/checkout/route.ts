import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createProCheckout } from "@/lib/mercadopago/helpers";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    if (profile?.plan === "pro") {
      return NextResponse.json(
        { error: "Ya tienes el plan Pro" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkout = await createProCheckout({
      userId: user.id,
      userEmail: user.email!,
      successUrl: `${baseUrl}/configuracion/suscripcion?status=success`,
      failureUrl: `${baseUrl}/configuracion/suscripcion?status=failure`,
      pendingUrl: `${baseUrl}/configuracion/suscripcion?status=pending`,
    });

    return NextResponse.json({
      checkoutUrl: checkout.sandboxInitPoint || checkout.initPoint,
      preferenceId: checkout.preferenceId,
    });
  } catch (error: unknown) {
    console.error("Checkout error full:", JSON.stringify(error, null, 2));
    console.error("Checkout error raw:", error);

    let errorMessage = "Error desconocido";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    return NextResponse.json(
      { error: `Error al crear checkout: ${errorMessage}` },
      { status: 500 }
    );
  }
}
