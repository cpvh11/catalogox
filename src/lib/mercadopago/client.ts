import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { PRO_PLAN_PRICE, PRO_PLAN_CURRENCY } from "@/lib/constants";

let _mercadopago: MercadoPagoConfig | null = null;
let _preferenceClient: Preference | null = null;
let _paymentClient: Payment | null = null;

function getMercadoPagoConfig(): MercadoPagoConfig {
  if (!_mercadopago) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("MP_ACCESS_TOKEN no está configurado");
    }
    _mercadopago = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 5000,
      },
    });
  }
  return _mercadopago;
}

export function getPreferenceClient(): Preference {
  if (!_preferenceClient) {
    _preferenceClient = new Preference(getMercadoPagoConfig());
  }
  return _preferenceClient;
}

export function getPaymentClient(): Payment {
  if (!_paymentClient) {
    _paymentClient = new Payment(getMercadoPagoConfig());
  }
  return _paymentClient;
}

export const PRO_PLAN = {
  title: "CatalogoX Pro",
  description: "Plan Pro mensual - Productos ilimitados, catálogos ilimitados, control de fiado y más",
  price: PRO_PLAN_PRICE,
  currency: PRO_PLAN_CURRENCY,
};
