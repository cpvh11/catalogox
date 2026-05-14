import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-8">
        Configuración
      </h1>

      <div className="space-y-4">
        <Link
          href="/configuracion/negocio"
          className="block bg-white rounded-lg border border-border p-6 hover:border-primary/50 transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-foreground">Mi negocio</h3>
              <p className="text-sm text-muted mt-1">
                Logo, nombre, descripción, redes sociales y horario
              </p>
              {profile?.nombre_negocio && (
                <p className="text-xs text-primary mt-2">
                  {profile.nombre_negocio}
                </p>
              )}
            </div>
          </div>
        </Link>

        <Link
          href="/configuracion/suscripcion"
          className="block bg-white rounded-lg border border-border p-6 hover:border-primary/50 transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-foreground">Suscripción</h3>
              <p className="text-sm text-muted mt-1">
                Gestiona tu plan y método de pago
              </p>
              <p className="text-xs mt-2">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${profile?.plan === "pro" ? "bg-primary/10 text-primary" : "bg-surface text-muted"}`}
                >
                  Plan {profile?.plan === "pro" ? "Pro" : "Gratuito"}
                </span>
              </p>
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-md bg-surface flex items-center justify-center text-muted">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-foreground">Cuenta</h3>
              <p className="text-sm text-muted mt-1">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
