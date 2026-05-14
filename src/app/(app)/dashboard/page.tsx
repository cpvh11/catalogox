import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getStats(userId: string) {
  const supabase = await createClient();

  const [productosResult, catalogosResult] = await Promise.all([
    supabase
      .from("productos")
      .select("id, costo, precio_menudeo, stock, activo")
      .eq("user_id", userId),
    supabase.from("catalogos").select("id").eq("user_id", userId),
  ]);

  const productos = productosResult.data || [];
  const catalogos = catalogosResult.data || [];

  const productosActivos = productos.filter((p) => p.activo).length;
  const productosBajoStock = productos.filter(
    (p) => p.activo && p.stock < 5
  ).length;

  let costoTotal = 0;
  let precioTotal = 0;
  productos.forEach((p) => {
    if (p.activo) {
      costoTotal += Number(p.costo) * p.stock;
      precioTotal += Number(p.precio_menudeo) * p.stock;
    }
  });

  const utilidadPotencial = precioTotal - costoTotal;
  const margenPromedio =
    costoTotal > 0 ? ((precioTotal - costoTotal) / costoTotal) * 100 : 0;

  return {
    productosActivos,
    productosBajoStock,
    catalogosActivos: catalogos.length,
    valorInventario: costoTotal,
    utilidadPotencial,
    margenPromedio,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_negocio, plan")
    .eq("id", user.id)
    .single();

  const stats = await getStats(user.id);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">
          {profile?.nombre_negocio
            ? `Hola, ${profile.nombre_negocio}`
            : "Dashboard"}
        </h1>
        <p className="text-muted mt-1">Resumen de tu negocio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Productos activos"
          value={stats.productosActivos.toString()}
          subtitle="en tu inventario"
        />
        <StatCard
          title="Valor del inventario"
          value={formatCurrency(stats.valorInventario)}
          subtitle="costo total"
          mono
        />
        <StatCard
          title="Utilidad potencial"
          value={formatCurrency(stats.utilidadPotencial)}
          subtitle="si vendes todo"
          mono
          positive={stats.utilidadPotencial > 0}
        />
        <StatCard
          title="Margen promedio"
          value={`${stats.margenPromedio.toFixed(1)}%`}
          subtitle="sobre costo"
          mono
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Acciones rápidas
          </h2>
          <div className="space-y-3">
            <QuickAction
              href="/productos/nuevo"
              label="Agregar producto"
              description="Añade un nuevo producto a tu inventario"
            />
            <QuickAction
              href="/catalogos/nuevo"
              label="Crear catálogo"
              description="Genera un catálogo para compartir"
            />
            <QuickAction
              href="/configuracion/negocio"
              label="Configurar negocio"
              description="Personaliza tu marca y perfil"
            />
          </div>
        </div>

        {stats.productosBajoStock > 0 && (
          <div className="bg-white rounded-lg border border-warning/50 p-6">
            <h2 className="text-lg font-semibold text-warning mb-4">
              Bajo stock
            </h2>
            <p className="text-muted">
              Tienes{" "}
              <span className="font-semibold text-foreground">
                {stats.productosBajoStock}
              </span>{" "}
              productos con menos de 5 unidades en stock.
            </p>
            <a
              href="/productos?stock=bajo"
              className="inline-block mt-4 text-sm font-medium text-primary hover:text-primary-light"
            >
              Ver productos →
            </a>
          </div>
        )}
      </div>

      {profile?.plan === "free" && (
        <div className="mt-8 bg-primary/5 rounded-lg border border-primary/20 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Plan Gratuito</h3>
              <p className="text-muted text-sm mt-1">
                Estás usando el plan gratuito con límite de 10 productos y 1
                catálogo.
              </p>
            </div>
            <a
              href="/configuracion/suscripcion"
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-light"
            >
              Upgrade a Pro
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  mono = false,
  positive,
}: {
  title: string;
  value: string;
  subtitle: string;
  mono?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-border p-6">
      <p className="text-sm text-muted">{title}</p>
      <p
        className={`text-2xl font-semibold mt-1 ${
          mono ? "font-mono" : ""
        } ${positive === true ? "text-success" : positive === false ? "text-danger" : "text-foreground"}`}
      >
        {value}
      </p>
      <p className="text-xs text-muted mt-1">{subtitle}</p>
    </div>
  );
}

function QuickAction({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="block p-4 rounded-md border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
    >
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-sm text-muted">{description}</p>
    </a>
  );
}
