"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { generateSlug, formatCurrency } from "@/lib/utils";
import type { Producto } from "@/types";

export default function NuevoCatalogoPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [tipoPrecio, setTipoPrecio] = useState<"menudeo" | "mayoreo">("menudeo");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadProductos() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("productos")
        .select("*")
        .eq("user_id", user.id)
        .eq("activo", true)
        .order("nombre");

      setProductos((data as Producto[]) || []);
      setLoading(false);
    }

    loadProductos();
  }, [supabase]);

  function handleNombreChange(value: string) {
    setNombre(value);
    setSlug(generateSlug(value));
  }

  function toggleProducto(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  function selectAll() {
    if (selectedIds.size === productos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(productos.map((p) => p.id)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selectedIds.size === 0) {
      setError("Selecciona al menos un producto");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("No autenticado");
      setSaving(false);
      return;
    }

    const { data: catalogo, error: catalogoError } = await supabase
      .from("catalogos")
      .insert({
        user_id: user.id,
        nombre,
        slug,
        tipo_precio: tipoPrecio,
        activo: true,
      })
      .select()
      .single();

    if (catalogoError) {
      if (catalogoError.code === "23505") {
        setError("Ya tienes un catálogo con este slug");
      } else {
        setError(catalogoError.message);
      }
      setSaving(false);
      return;
    }

    const catalogoProductos = Array.from(selectedIds).map((productoId, idx) => ({
      catalogo_id: catalogo.id,
      producto_id: productoId,
      orden: idx,
    }));

    const { error: productosError } = await supabase
      .from("catalogo_productos")
      .insert(catalogoProductos);

    if (productosError) {
      setError(productosError.message);
      setSaving(false);
      return;
    }

    router.push("/catalogos");
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
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link
          href="/catalogos"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Volver a catálogos
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mt-2">
          Crear catálogo
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
              Nombre del catálogo *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ej: Catálogo Menudeo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Tipo de precio
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoPrecio"
                  value="menudeo"
                  checked={tipoPrecio === "menudeo"}
                  onChange={() => setTipoPrecio("menudeo")}
                  className="text-primary"
                />
                <span>Menudeo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoPrecio"
                  value="mayoreo"
                  checked={tipoPrecio === "mayoreo"}
                  onChange={() => setTipoPrecio("mayoreo")}
                  className="text-primary"
                />
                <span>Mayoreo</span>
              </label>
            </div>
            <p className="text-xs text-muted mt-1">
              El catálogo mostrará el precio de{" "}
              {tipoPrecio === "menudeo" ? "menudeo" : "mayoreo"} de cada producto
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-foreground">
              Seleccionar productos ({selectedIds.size} de {productos.length})
            </h2>
            <button
              type="button"
              onClick={selectAll}
              className="text-sm text-primary hover:text-primary-light"
            >
              {selectedIds.size === productos.length
                ? "Deseleccionar todos"
                : "Seleccionar todos"}
            </button>
          </div>

          {productos.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {productos.map((producto) => (
                <label
                  key={producto.id}
                  className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    selectedIds.has(producto.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-surface"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(producto.id)}
                    onChange={() => toggleProducto(producto.id)}
                    className="w-4 h-4 text-primary border-border rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {producto.nombre}
                    </p>
                    <p className="text-sm text-muted">
                      {tipoPrecio === "menudeo"
                        ? formatCurrency(producto.precio_menudeo)
                        : producto.precio_mayoreo
                          ? formatCurrency(producto.precio_mayoreo)
                          : "Sin precio mayoreo"}
                    </p>
                  </div>
                  <span className="text-xs text-muted">
                    Stock: {producto.stock}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted mb-4">No tienes productos activos</p>
              <Link href="/productos/nuevo" className="text-primary hover:underline">
                Agregar producto
              </Link>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving || productos.length === 0}
            className="px-6 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light disabled:opacity-50"
          >
            {saving ? "Creando..." : "Crear catálogo"}
          </button>
          <Link
            href="/catalogos"
            className="px-6 py-2 border border-border rounded-md font-medium hover:bg-surface"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
