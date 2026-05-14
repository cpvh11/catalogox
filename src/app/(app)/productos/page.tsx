import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, calculateMargin } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Productos</h1>
          <p className="text-muted mt-1">
            {productos?.length || 0} productos en tu inventario
          </p>
        </div>
        <Link
          href="/productos/nuevo"
          className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light"
        >
          + Agregar producto
        </Link>
      </div>

      {productos && productos.length > 0 ? (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted">
                  Producto
                </th>
                <th className="text-right px-6 py-3 text-sm font-medium text-muted">
                  Costo
                </th>
                <th className="text-right px-6 py-3 text-sm font-medium text-muted">
                  Precio
                </th>
                <th className="text-right px-6 py-3 text-sm font-medium text-muted">
                  Margen
                </th>
                <th className="text-right px-6 py-3 text-sm font-medium text-muted">
                  Stock
                </th>
                <th className="text-right px-6 py-3 text-sm font-medium text-muted">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {productos.map((producto) => (
                <tr key={producto.id} className="hover:bg-surface/50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/productos/${producto.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {producto.nombre}
                    </Link>
                    {producto.descripcion && (
                      <p className="text-sm text-muted truncate max-w-xs">
                        {producto.descripcion}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm">
                    {formatCurrency(producto.costo)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm">
                    {formatCurrency(producto.precio_menudeo)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-success">
                    {calculateMargin(
                      producto.costo,
                      producto.precio_menudeo
                    ).toFixed(0)}
                    %
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`${producto.stock < 5 ? "text-warning" : "text-foreground"}`}
                    >
                      {producto.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${producto.activo ? "bg-success/10 text-success" : "bg-muted/10 text-muted"}`}
                    >
                      {producto.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Sin productos aún
          </h3>
          <p className="text-muted mb-6">
            Empieza agregando tu primer producto al inventario.
          </p>
          <Link
            href="/productos/nuevo"
            className="inline-block px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light"
          >
            Agregar primer producto
          </Link>
        </div>
      )}
    </div>
  );
}
