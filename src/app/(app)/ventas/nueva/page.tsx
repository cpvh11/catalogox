"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface Producto {
  id: string;
  nombre: string;
  precio_menudeo: number;
  costo: number;
  stock: number;
}

interface Cliente {
  id: string;
  nombre: string;
}

interface LineaVenta {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
}

export default function NuevaVentaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [lineas, setLineas] = useState<LineaVenta[]>([]);

  const [clienteId, setClienteId] = useState<string>("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [notas, setNotas] = useState("");

  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [mostrarProductos, setMostrarProductos] = useState(false);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [productosRes, clientesRes] = await Promise.all([
        supabase
          .from("productos")
          .select("id, nombre, precio_menudeo, costo, stock")
          .eq("user_id", user.id)
          .eq("activo", true)
          .order("nombre"),
        supabase
          .from("clientes")
          .select("id, nombre")
          .eq("user_id", user.id)
          .order("nombre"),
      ]);

      setProductos((productosRes.data as Producto[]) || []);
      setClientes((clientesRes.data as Cliente[]) || []);
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) &&
      !lineas.some((l) => l.producto.id === p.id)
  );

  function agregarProducto(producto: Producto) {
    setLineas([
      ...lineas,
      {
        producto,
        cantidad: 1,
        precioUnitario: producto.precio_menudeo,
      },
    ]);
    setBusquedaProducto("");
    setMostrarProductos(false);
  }

  function actualizarCantidad(index: number, cantidad: number) {
    const nuevasLineas = [...lineas];
    nuevasLineas[index].cantidad = Math.max(1, cantidad);
    setLineas(nuevasLineas);
  }

  function actualizarPrecio(index: number, precio: number) {
    const nuevasLineas = [...lineas];
    nuevasLineas[index].precioUnitario = Math.max(0, precio);
    setLineas(nuevasLineas);
  }

  function eliminarLinea(index: number) {
    setLineas(lineas.filter((_, i) => i !== index));
  }

  const total = lineas.reduce(
    (sum, l) => sum + l.cantidad * l.precioUnitario,
    0
  );
  const costoTotal = lineas.reduce(
    (sum, l) => sum + l.cantidad * l.producto.costo,
    0
  );
  const ganancia = total - costoTotal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (lineas.length === 0) {
      setError("Agrega al menos un producto a la venta");
      return;
    }

    // Validate stock
    for (const linea of lineas) {
      if (linea.cantidad > linea.producto.stock) {
        setError(
          `No hay suficiente stock de "${linea.producto.nombre}". Disponible: ${linea.producto.stock}`
        );
        return;
      }
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

    // Create venta
    const { data: venta, error: ventaError } = await supabase
      .from("ventas")
      .insert({
        user_id: user.id,
        cliente_id: clienteId || null,
        cliente_nombre: clienteNombre.trim() || (clienteId ? null : "Anónimo"),
        total,
        costo_total: costoTotal,
        fecha,
        notas: notas.trim() || null,
      })
      .select()
      .single();

    if (ventaError) {
      setError(ventaError.message);
      setSaving(false);
      return;
    }

    // Create venta_productos
    const ventaProductos = lineas.map((l) => ({
      venta_id: venta.id,
      producto_id: l.producto.id,
      producto_nombre: l.producto.nombre,
      cantidad: l.cantidad,
      precio_unitario: l.precioUnitario,
      costo_unitario: l.producto.costo,
      subtotal: l.cantidad * l.precioUnitario,
    }));

    const { error: productosError } = await supabase
      .from("venta_productos")
      .insert(ventaProductos);

    if (productosError) {
      setError(productosError.message);
      setSaving(false);
      return;
    }

    // Update stock for each product
    for (const linea of lineas) {
      const nuevoStock = linea.producto.stock - linea.cantidad;
      await supabase
        .from("productos")
        .update({ stock: nuevoStock })
        .eq("id", linea.producto.id);
    }

    router.push("/dashboard");
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
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Volver al dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mt-2">
          Registrar venta
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-danger/10 text-danger text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente y fecha */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="font-medium text-foreground mb-4">
            Información de la venta
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Cliente (opcional)
              </label>
              <select
                value={clienteId}
                onChange={(e) => {
                  setClienteId(e.target.value);
                  if (e.target.value) {
                    const cliente = clientes.find((c) => c.id === e.target.value);
                    setClienteNombre(cliente?.nombre || "");
                  }
                }}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Venta anónima</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nombre cliente
              </label>
              <input
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="font-medium text-foreground mb-4">Productos</h2>

          {/* Buscar producto */}
          <div className="relative mb-4">
            <input
              type="text"
              value={busquedaProducto}
              onChange={(e) => {
                setBusquedaProducto(e.target.value);
                setMostrarProductos(true);
              }}
              onFocus={() => setMostrarProductos(true)}
              placeholder="Buscar producto para agregar..."
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {mostrarProductos && busquedaProducto && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                {productosFiltrados.length > 0 ? (
                  productosFiltrados.slice(0, 10).map((producto) => (
                    <button
                      key={producto.id}
                      type="button"
                      onClick={() => agregarProducto(producto)}
                      className="w-full px-4 py-2 text-left hover:bg-surface flex justify-between items-center"
                    >
                      <span>{producto.nombre}</span>
                      <span className="text-sm text-muted">
                        {formatCurrency(producto.precio_menudeo)} · Stock:{" "}
                        {producto.stock}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-muted">
                    No se encontraron productos
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lista de productos agregados */}
          {lineas.length > 0 ? (
            <div className="space-y-3">
              {lineas.map((linea, index) => (
                <div
                  key={linea.producto.id}
                  className="flex items-center gap-4 p-3 bg-surface rounded-md"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {linea.producto.nombre}
                    </p>
                    <p className="text-xs text-muted">
                      Stock: {linea.producto.stock} · Costo:{" "}
                      {formatCurrency(linea.producto.costo)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted">Cant:</label>
                    <input
                      type="number"
                      min="1"
                      max={linea.producto.stock}
                      value={linea.cantidad}
                      onChange={(e) =>
                        actualizarCantidad(index, parseInt(e.target.value) || 1)
                      }
                      className="w-16 px-2 py-1 text-center border border-border rounded-md"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted">$</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={linea.precioUnitario}
                      onChange={(e) =>
                        actualizarPrecio(index, parseFloat(e.target.value) || 0)
                      }
                      className="w-24 px-2 py-1 text-right border border-border rounded-md font-mono"
                    />
                  </div>
                  <div className="w-24 text-right font-mono font-semibold">
                    {formatCurrency(linea.cantidad * linea.precioUnitario)}
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarLinea(index)}
                    className="p-1 text-muted hover:text-danger"
                  >
                    <svg
                      className="w-5 h-5"
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
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted">
              Busca productos arriba para agregarlos a la venta
            </div>
          )}
        </div>

        {/* Notas */}
        <div className="bg-white rounded-lg border border-border p-6">
          <label className="block text-sm font-medium text-foreground mb-1">
            Notas (opcional)
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            placeholder="Notas adicionales sobre la venta..."
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* Resumen */}
        {lineas.length > 0 && (
          <div className="bg-white rounded-lg border border-border p-6">
            <h2 className="font-medium text-foreground mb-4">Resumen</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Productos:</span>
                <span>{lineas.reduce((sum, l) => sum + l.cantidad, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Costo total:</span>
                <span className="font-mono">{formatCurrency(costoTotal)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total venta:</span>
                <span className="font-mono">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-success">
                <span>Ganancia:</span>
                <span className="font-mono">{formatCurrency(ganancia)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving || lineas.length === 0}
            className="px-6 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Registrar venta"}
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-2 border border-border rounded-md font-medium hover:bg-surface"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
