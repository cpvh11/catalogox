"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { PRO_PLAN_PRICE } from "@/lib/constants";

function SuscripcionContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();

      setPlan((data?.plan as "free" | "pro") || "free");
      setLoading(false);
    }

    loadProfile();
  }, [supabase]);

  async function handleUpgrade() {
    setError(null);
    setUpgrading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear checkout");
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar");
      setUpgrading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link
          href="/configuracion"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Volver a configuración
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mt-2">
          Suscripción
        </h1>
      </div>

      {status === "success" && (
        <div className="mb-6 p-4 rounded-md bg-success/10 text-success">
          ¡Pago exitoso! Tu cuenta ha sido actualizada a Pro.
        </div>
      )}

      {status === "failure" && (
        <div className="mb-6 p-4 rounded-md bg-danger/10 text-danger">
          El pago no pudo procesarse. Intenta de nuevo.
        </div>
      )}

      {status === "pending" && (
        <div className="mb-6 p-4 rounded-md bg-warning/10 text-warning">
          Tu pago está pendiente. Te notificaremos cuando se procese.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-md bg-danger/10 text-danger text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-foreground">
              Plan {plan === "pro" ? "Pro" : "Gratuito"}
            </h2>
            <p className="text-muted text-sm mt-1">
              {plan === "pro"
                ? "Tienes acceso a todas las funciones"
                : "Funciones limitadas"}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              plan === "pro"
                ? "bg-primary/10 text-primary"
                : "bg-surface text-muted"
            }`}
          >
            {plan === "pro" ? "Activo" : "Gratuito"}
          </span>
        </div>

        {plan === "pro" && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted">
              Gracias por ser usuario Pro. Tu suscripción está activa.
            </p>
          </div>
        )}
      </div>

      {plan === "free" && (
        <div className="bg-primary/5 rounded-lg border border-primary/20 p-6">
          <h3 className="font-semibold text-foreground mb-2">
            Actualiza a Pro
          </h3>
          <p className="text-muted text-sm mb-4">
            Desbloquea todas las funciones de CatalogoX
          </p>

          <ul className="space-y-2 mb-6">
            {[
              "Productos ilimitados",
              "Catálogos ilimitados",
              "Control de ventas a crédito (fiado)",
              "Reportes semanales por email",
              "Sin marca de agua en catálogos",
              "Soporte prioritario",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <svg
                  className="w-4 h-4 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-3xl font-bold text-foreground font-mono">
              {formatCurrency(PRO_PLAN_PRICE)}
            </span>
            <span className="text-muted">/mes</span>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="w-full py-3 bg-primary text-white rounded-md font-medium hover:bg-primary-light disabled:opacity-50"
          >
            {upgrading ? "Procesando..." : "Actualizar a Pro"}
          </button>

          <p className="text-xs text-muted mt-4 text-center">
            Pago seguro con MercadoPago. Cancela cuando quieras.
          </p>
        </div>
      )}

      <div className="mt-8">
        <h3 className="font-medium text-foreground mb-4">Comparación de planes</h3>
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted">
                  Función
                </th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted">
                  Gratis
                </th>
                <th className="text-center px-4 py-3 text-sm font-medium text-primary">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <ComparisonRow feature="Productos" free="10" pro="Ilimitados" />
              <ComparisonRow feature="Catálogos" free="1" pro="Ilimitados" />
              <ComparisonRow feature="Control de fiado" free={false} pro={true} />
              <ComparisonRow feature="Reportes por email" free={false} pro={true} />
              <ComparisonRow feature="Sin marca de agua" free={false} pro={true} />
              <ComparisonRow feature="Soporte prioritario" free={false} pro={true} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ComparisonRow({
  feature,
  free,
  pro,
}: {
  feature: string;
  free: string | boolean;
  pro: string | boolean;
}) {
  return (
    <tr>
      <td className="px-4 py-3 text-sm text-foreground">{feature}</td>
      <td className="px-4 py-3 text-center">
        {typeof free === "boolean" ? (
          free ? (
            <Check />
          ) : (
            <X />
          )
        ) : (
          <span className="text-sm text-muted">{free}</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {typeof pro === "boolean" ? (
          pro ? (
            <Check />
          ) : (
            <X />
          )
        ) : (
          <span className="text-sm font-medium text-foreground">{pro}</span>
        )}
      </td>
    </tr>
  );
}

function Check() {
  return (
    <svg
      className="w-5 h-5 text-success mx-auto"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function X() {
  return (
    <svg
      className="w-5 h-5 text-muted mx-auto"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export default function SuscripcionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-muted">Cargando...</div>
        </div>
      }
    >
      <SuscripcionContent />
    </Suspense>
  );
}
