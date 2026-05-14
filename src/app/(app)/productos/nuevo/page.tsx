"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, calculateMargin, calculateProfit } from "@/lib/utils";
import { ImageUpload } from "@/components/shared/image-upload";
import { PLAN_LIMITS } from "@/lib/constants";

export default function NuevoProductoPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [costo, setCosto] = useState("");
  const [precioMenudeo, setPrecioMenudeo] = useState("");
  const [precioMayoreo, setPrecioMayoreo] = useState("");
  const [stock, setStock] = useState("0");
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);

  const costoNum = parseFloat(costo) || 0;
  const precioNum = parseFloat(precioMenudeo) || 0;
  const margen = calculateMargin(costoNum, precioNum);
  const utilidad = calculateProfit(costoNum, precioNum);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("No autenticado");
      setLoading(false);
      return;
    }

    // Verificar límite del plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const plan = (profile?.plan || "free") as "free" | "pro";
    const maxProductos = PLAN_LIMITS[plan].maxProductos;

    if (maxProductos !== Infinity) {
      const { count } = await supabase
        .from("productos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if ((count || 0) >= maxProductos) {
        setError(
          `Has alcanzado el límite de ${maxProductos} productos del plan gratuito. Actualiza a Pro para productos ilimitados.`
        );
        setLoading(false);
        return;
      }
    }

    const { error: insertError } = await supabase.from("productos").insert({
      user_id: user.id,
      nombre,
      descripcion: descripcion || null,
      costo: costoNum,
      precio_menudeo: precioNum,
      precio_mayoreo: precioMayoreo ? parseFloat(precioMayoreo) : null,
      stock: parseInt(stock) || 0,
      imagen_url: imagenUrl,
      activo: true,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/productos");
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link
          href="/productos"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Volver a productos
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mt-2">
          Agregar producto
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-danger/10 text-danger text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nombre del producto *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ej: Labial Matte Rojo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Descripción opcional del producto..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Imagen del producto
            </label>
            <ImageUpload value={imagenUrl} onChange={setImagenUrl} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-6 space-y-4">
          <h2 className="font-medium text-foreground">Precios</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Costo (tu precio de compra) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  required
                  className="w-full pl-7 pr-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Precio menudeo *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioMenudeo}
                  onChange={(e) => setPrecioMenudeo(e.target.value)}
                  required
                  className="w-full pl-7 pr-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Precio mayoreo (opcional)
            </label>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={precioMayoreo}
                onChange={(e) => setPrecioMayoreo(e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                placeholder="0.00"
              />
            </div>
          </div>

          {costoNum > 0 && precioNum > 0 && (
            <div className="pt-4 border-t border-border flex gap-6">
              <div>
                <p className="text-sm text-muted">Margen</p>
                <p
                  className={`text-lg font-mono font-semibold ${margen >= 0 ? "text-success" : "text-danger"}`}
                >
                  {margen.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Utilidad por unidad</p>
                <p
                  className={`text-lg font-mono font-semibold ${utilidad >= 0 ? "text-success" : "text-danger"}`}
                >
                  {formatCurrency(utilidad)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-foreground mb-1">
              Stock inicial
            </label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar producto"}
          </button>
          <Link
            href="/productos"
            className="px-6 py-2 border border-border rounded-md font-medium hover:bg-surface"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
