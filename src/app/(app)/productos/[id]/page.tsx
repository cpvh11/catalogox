"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, calculateMargin, calculateProfit } from "@/lib/utils";
import { ImageUpload } from "@/components/shared/image-upload";

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [costo, setCosto] = useState("");
  const [precioMenudeo, setPrecioMenudeo] = useState("");
  const [precioMayoreo, setPrecioMayoreo] = useState("");
  const [stock, setStock] = useState("0");
  const [activo, setActivo] = useState(true);
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);

  const costoNum = parseFloat(costo) || 0;
  const precioNum = parseFloat(precioMenudeo) || 0;
  const margen = calculateMargin(costoNum, precioNum);
  const utilidad = calculateProfit(costoNum, precioNum);

  useEffect(() => {
    async function loadProducto() {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error || !data) {
        setError("Producto no encontrado");
        setLoading(false);
        return;
      }

      setNombre(data.nombre);
      setDescripcion(data.descripcion || "");
      setCosto(data.costo?.toString() || "0");
      setPrecioMenudeo(data.precio_menudeo?.toString() || "0");
      setPrecioMayoreo(data.precio_mayoreo?.toString() || "");
      setStock(data.stock?.toString() || "0");
      setActivo(data.activo);
      setImagenUrl(data.imagen_url || null);
      setLoading(false);
    }

    loadProducto();
  }, [params.id, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const { error: updateError } = await supabase
      .from("productos")
      .update({
        nombre,
        descripcion: descripcion || null,
        costo: costoNum,
        precio_menudeo: precioNum,
        precio_mayoreo: precioMayoreo ? parseFloat(precioMayoreo) : null,
        stock: parseInt(stock) || 0,
        imagen_url: imagenUrl,
        activo,
      })
      .eq("id", params.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push("/productos");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    const { error } = await supabase
      .from("productos")
      .delete()
      .eq("id", params.id);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/productos");
    router.refresh();
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
          href="/productos"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Volver a productos
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mt-2">
          Editar producto
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Imagen del producto
            </label>
            <ImageUpload value={imagenUrl} onChange={setImagenUrl} />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
            />
            <label htmlFor="activo" className="text-sm text-foreground">
              Producto activo (visible en catálogos)
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-6 space-y-4">
          <h2 className="font-medium text-foreground">Precios</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Costo *
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
                <p className="text-sm text-muted">Utilidad</p>
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
              Stock
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

        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <Link
              href="/productos"
              className="px-6 py-2 border border-border rounded-md font-medium hover:bg-surface"
            >
              Cancelar
            </Link>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 text-danger hover:bg-danger/10 rounded-md text-sm"
          >
            Eliminar producto
          </button>
        </div>
      </form>
    </div>
  );
}
