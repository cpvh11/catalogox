"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface Cliente {
  id: string;
  nombre: string;
  telefono: string | null;
}

export default function VentaCreditoPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);

  // Form fields
  const [clienteId, setClienteId] = useState("");
  const [nuevoCliente, setNuevoCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [fechaLiquidacion, setFechaLiquidacion] = useState("");
  const [isNewClient, setIsNewClient] = useState(false);

  useEffect(() => {
    async function loadClientes() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("clientes_fiado")
        .select("id, nombre, telefono")
        .eq("user_id", user.id)
        .order("nombre");

      setClientes(data || []);
      setLoadingClientes(false);

      if (!data || data.length === 0) {
        setIsNewClient(true);
      }
    }

    loadClientes();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isNewClient && !clienteId) {
      setError("Selecciona un cliente o crea uno nuevo");
      return;
    }

    if (isNewClient && !nuevoCliente.trim()) {
      setError("Ingresa el nombre del cliente");
      return;
    }

    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum <= 0) {
      setError("Ingresa un monto válido");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("No autenticado");
      setLoading(false);
      return;
    }

    let finalClienteId = clienteId;

    if (isNewClient) {
      const { data: newCliente, error: clienteError } = await supabase
        .from("clientes_fiado")
        .insert({
          user_id: user.id,
          nombre: nuevoCliente.trim(),
          telefono: telefonoCliente.trim() || null,
        })
        .select()
        .single();

      if (clienteError) {
        setError(`Error al crear cliente: ${clienteError.message}`);
        setLoading(false);
        return;
      }

      finalClienteId = newCliente.id;
    }

    const { error: ventaError } = await supabase.from("ventas_fiado").insert({
      user_id: user.id,
      cliente_id: finalClienteId,
      descripcion: descripcion.trim() || null,
      monto: montoNum,
      pagado: 0,
      fecha,
      fecha_liquidacion: fechaLiquidacion || null,
    });

    if (ventaError) {
      setError(`Error al registrar venta: ${ventaError.message}`);
      setLoading(false);
      return;
    }

    router.push("/ventas");
    router.refresh();
  }

  function getDefaultLiquidacionDate() {
    const date = new Date();
    date.setDate(date.getDate() + 15);
    return date.toISOString().split("T")[0];
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <Link
          href="/ventas"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Volver a ventas
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mt-2">
          Venta a Crédito
        </h1>
        <p className="text-muted mt-1">Registra una venta fiada con fecha de pago acordada</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-danger/10 text-danger text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <div className="bg-white rounded-lg border border-border p-6 space-y-4">
          <h2 className="font-medium text-foreground">Cliente</h2>

          {!loadingClientes && clientes.length > 0 && (
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setIsNewClient(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  !isNewClient
                    ? "bg-primary text-white"
                    : "bg-surface text-foreground hover:bg-border/50"
                }`}
              >
                Cliente existente
              </button>
              <button
                type="button"
                onClick={() => setIsNewClient(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isNewClient
                    ? "bg-primary text-white"
                    : "bg-surface text-foreground hover:bg-border/50"
                }`}
              >
                Nuevo cliente
              </button>
            </div>
          )}

          {!isNewClient && clientes.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Seleccionar cliente *
              </label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              >
                <option value="">Selecciona un cliente...</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                    {cliente.telefono ? ` (${cliente.telefono})` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nombre del cliente *
                </label>
                <input
                  type="text"
                  value={nuevoCliente}
                  onChange={(e) => setNuevoCliente(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={telefonoCliente}
                  onChange={(e) => setTelefonoCliente(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="55 1234 5678"
                />
              </div>
            </div>
          )}
        </div>

        {/* Venta */}
        <div className="bg-white rounded-lg border border-border p-6 space-y-4">
          <h2 className="font-medium text-foreground">Detalle de la venta</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Monto *
            </label>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
                className="w-full pl-7 pr-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Descripción / Productos
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ej: 2 labiales, 1 base de maquillaje"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Fecha de la venta
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Fecha de pago acordada
              </label>
              <input
                type="date"
                value={fechaLiquidacion}
                onChange={(e) => setFechaLiquidacion(e.target.value)}
                min={fecha}
                placeholder={getDefaultLiquidacionDate()}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted mt-1">
                ¿Cuándo esperas que te pague?
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        {monto && parseFloat(monto) > 0 && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <p className="text-sm text-muted">Resumen del crédito:</p>
            <p className="text-lg font-semibold text-foreground">
              {isNewClient ? nuevoCliente || "Nuevo cliente" : clientes.find(c => c.id === clienteId)?.nombre || "Cliente"}
              {" "}debe{" "}
              <span className="font-mono text-danger">
                {formatCurrency(parseFloat(monto))}
              </span>
            </p>
            {fechaLiquidacion && (
              <p className="text-sm text-muted mt-1">
                Fecha de pago acordada:{" "}
                <span className="font-medium text-foreground">
                  {new Date(fechaLiquidacion + "T12:00:00").toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Registrar crédito"}
          </button>
          <Link
            href="/ventas"
            className="px-6 py-2 border border-border rounded-md font-medium hover:bg-surface"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
