import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CatalogosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("slug, plan")
    .eq("id", user.id)
    .single();

  const { data: catalogos } = await supabase
    .from("catalogos")
    .select("*, catalogo_productos(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const canCreateMore =
    profile?.plan === "pro" || (catalogos?.length || 0) < 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Catálogos</h1>
          <p className="text-muted mt-1">
            Genera catálogos para compartir con tus clientes
          </p>
        </div>
        {canCreateMore ? (
          <Link
            href="/catalogos/nuevo"
            className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light"
          >
            + Crear catálogo
          </Link>
        ) : (
          <div className="text-sm text-muted">
            Límite alcanzado (plan free).{" "}
            <Link
              href="/configuracion/suscripcion"
              className="text-primary hover:underline"
            >
              Upgrade
            </Link>
          </div>
        )}
      </div>

      {catalogos && catalogos.length > 0 ? (
        <div className="grid gap-4">
          {catalogos.map((catalogo) => (
            <div
              key={catalogo.id}
              className="bg-white rounded-lg border border-border p-6 flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium text-foreground">
                  {catalogo.nombre}
                </h3>
                <p className="text-sm text-muted mt-1">
                  Tipo: {catalogo.tipo_precio} •{" "}
                  {catalogo.activo ? "Activo" : "Inactivo"}
                </p>
                {profile?.slug && (
                  <p className="text-xs text-primary mt-2">
                    catalogox.com/c/{profile.slug}/{catalogo.slug}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/catalogos/${catalogo.id}`}
                  className="px-3 py-1.5 border border-border rounded-md text-sm hover:bg-surface"
                >
                  Editar
                </Link>
                {profile?.slug && catalogo.activo && (
                  <a
                    href={`/c/${profile.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-primary text-white rounded-md text-sm hover:bg-primary-light"
                  >
                    Ver catálogo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface mx-auto flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Sin catálogos aún
          </h3>
          <p className="text-muted mb-6">
            Crea tu primer catálogo para compartir con clientes.
          </p>
          <Link
            href="/catalogos/nuevo"
            className="inline-block px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light"
          >
            Crear mi primer catálogo
          </Link>
        </div>
      )}
    </div>
  );
}
