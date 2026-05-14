"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface Abono {
  id: string;
  monto: number;
  saldo_restante: number;
  fecha: string;
  notas: string | null;
}

interface VentaFiado {
  id: string;
  descripcion: string;
  monto: number;
  pagado: number;
  fecha: string;
  fecha_liquidacion: string | null;
  created_at: string;
  abonos: Abono[];
}

interface Cliente {
  id: string;
  nombre: string;
  telefono: string | null;
  notas: string | null;
}

export default function ClienteVentasPage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [ventas, setVentas] = useState<VentaFiado[]>([]);
  const [loading, setLoading] = useState(true);
  const [liquidando, setLiquidando] = useState<string | null>(null);
  const [montoAbono, setMontoAbono] = useState<Record<string, string>>({});
  const [expandedVenta, setExpandedVenta] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setClienteId(p.clienteId));
  }, [params]);

  useEffect(() => {
    if (!clienteId) return;

    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: clienteData } = await supabase
        .from("clientes_fiado")
        .select("*")
        .eq("id", clienteId)
        .eq("user_id", user.id)
        .single();

      if (!clienteData) {
        router.push("/ventas");
        return;
      }

      setCliente(clienteData);

      // Get ventas with abonos
      const { data: ventasData } = await supabase
        .from("ventas_fiado")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("fecha", { ascending: false });

      const ventasWithAbonos: VentaFiado[] = [];

      for (const venta of ventasData || []) {
        const { data: abonosData } = await supabase
          .from("abonos_fiado")
          .select("*")
          .eq("venta_fiado_id", venta.id)
          .order("fecha", { ascending: true });

        ventasWithAbonos.push({
          id: venta.id,
          descripcion: venta.descripcion,
          monto: Number(venta.monto),
          pagado: Number(venta.pagado),
          fecha: venta.fecha,
          fecha_liquidacion: venta.fecha_liquidacion,
          created_at: venta.created_at,
          abonos: (abonosData || []).map((a: Record<string, unknown>) => ({
            id: a.id,
            monto: Number(a.monto),
            saldo_restante: Number(a.saldo_restante),
            fecha: a.fecha,
            notas: a.notas,
          })),
        });
      }

      setVentas(ventasWithAbonos);
      setLoading(false);
    }

    loadData();
  }, [clienteId, supabase, router]);

  const saldoTotal = ventas.reduce(
    (sum, v) => sum + (v.monto - v.pagado),
    0
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function getStatus(fechaLiquidacion: string | null): "vencido" | "proximo" | "normal" {
    if (!fechaLiquidacion) return "normal";
    const fecha = new Date(fechaLiquidacion);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    if (fecha < today) return "vencido";
    if (fecha <= in7Days) return "proximo";
    return "normal";
  }

  async function handleAbonar(ventaId: string) {
    const monto = parseFloat(montoAbono[ventaId] || "0");
    if (monto <= 0 || !userId) return;

    setLiquidando(ventaId);

    const venta = ventas.find((v) => v.id === ventaId);
    if (!venta) return;

    const pendiente = venta.monto - venta.pagado;
    const abonoReal = Math.min(monto, pendiente);
    const nuevoSaldo = pendiente - abonoReal;
    const nuevoPagado = venta.pagado + abonoReal;

    // Insert abono with saldo_restante
    const { error: abonoError } = await supabase.from("abonos_fiado").insert({
      venta_fiado_id: ventaId,
      user_id: userId,
      monto: abonoReal,
      saldo_restante: nuevoSaldo,
      fecha: new Date().toISOString().split("T")[0],
    });

    if (abonoError) {
      console.error("Error registrando abono:", abonoError);
      setLiquidando(null);
      return;
    }

    // Update ventas_fiado.pagado
    const { error: updateError } = await supabase
      .from("ventas_fiado")
      .update({ pagado: nuevoPagado })
      .eq("id", ventaId);

    if (updateError) {
      console.error("Error actualizando venta:", updateError);
    }

    // Update local state
    const newAbono: Abono = {
      id: crypto.randomUUID(),
      monto: abonoReal,
      saldo_restante: nuevoSaldo,
      fecha: new Date().toISOString().split("T")[0],
      notas: null,
    };

    setVentas((prev) =>
      prev.map((v) =>
        v.id === ventaId
          ? { ...v, pagado: nuevoPagado, abonos: [...v.abonos, newAbono] }
          : v
      )
    );
    setMontoAbono((prev) => ({ ...prev, [ventaId]: "" }));
    setLiquidando(null);
  }

  async function handleLiquidarTotal(ventaId: string) {
    if (!userId) return;
    setLiquidando(ventaId);

    const venta = ventas.find((v) => v.id === ventaId);
    if (!venta) return;

    const pendiente = venta.monto - venta.pagado;

    // Insert abono with saldo_restante = 0
    const { error: abonoError } = await supabase.from("abonos_fiado").insert({
      venta_fiado_id: ventaId,
      user_id: userId,
      monto: pendiente,
      saldo_restante: 0,
      fecha: new Date().toISOString().split("T")[0],
      notas: "Liquidación total",
    });

    if (abonoError) {
      console.error("Error registrando abono:", abonoError);
      setLiquidando(null);
      return;
    }

    // Update ventas_fiado.pagado
    const { error: updateError } = await supabase
      .from("ventas_fiado")
      .update({ pagado: venta.monto })
      .eq("id", ventaId);

    if (updateError) {
      console.error("Error actualizando venta:", updateError);
    }

    // Update local state
    const newAbono: Abono = {
      id: crypto.randomUUID(),
      monto: pendiente,
      saldo_restante: 0,
      fecha: new Date().toISOString().split("T")[0],
      notas: "Liquidación total",
    };

    setVentas((prev) =>
      prev.map((v) =>
        v.id === ventaId
          ? { ...v, pagado: v.monto, abonos: [...v.abonos, newAbono] }
          : v
      )
    );
    setLiquidando(null);
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatShortDate(dateStr: string): string {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted">Cargando...</div>
      </div>
    );
  }

  if (!cliente) {
    return null;
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link
          href="/ventas"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Volver a ventas
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {cliente.nombre}
            </h1>
            {cliente.telefono && (
              <p className="text-muted mt-1">
                <a
                  href={`tel:${cliente.telefono}`}
                  className="hover:text-primary"
                >
                  {cliente.telefono}
                </a>
                <a
                  href={`https://wa.me/${cliente.telefono.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 text-success hover:underline"
                >
                  WhatsApp
                </a>
              </p>
            )}
            {cliente.notas && (
              <p className="text-sm text-muted mt-2">{cliente.notas}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Saldo pendiente</p>
            <p
              className={`text-2xl font-mono font-bold ${saldoTotal > 0 ? "text-danger" : "text-success"}`}
            >
              {formatCurrency(saldoTotal)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Historial de créditos
        </h2>
        <Link
          href="/ventas/credito"
          className="text-sm text-primary hover:underline"
        >
          + Nueva venta a crédito
        </Link>
      </div>

      {ventas.length > 0 ? (
        <div className="space-y-4">
          {ventas.map((venta) => {
            const pendiente = venta.monto - venta.pagado;
            const liquidado = pendiente <= 0;
            const status = getStatus(venta.fecha_liquidacion);
            const isExpanded = expandedVenta === venta.id;

            return (
              <div
                key={venta.id}
                className={`bg-white rounded-lg border p-4 ${
                  liquidado
                    ? "border-success/30 bg-success/5"
                    : status === "vencido"
                      ? "border-danger bg-danger/5"
                      : status === "proximo"
                        ? "border-warning bg-warning/5"
                        : "border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {venta.descripcion || "Venta a crédito"}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted mt-1">
                      <span>Venta: {formatDate(venta.fecha)}</span>
                      {venta.fecha_liquidacion && !liquidado && (
                        <span
                          className={
                            status === "vencido"
                              ? "text-danger font-medium"
                              : status === "proximo"
                                ? "text-warning font-medium"
                                : ""
                          }
                        >
                          Vence: {formatDate(venta.fecha_liquidacion)}
                          {status === "vencido" && " (VENCIDO)"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-foreground">
                      {formatCurrency(venta.monto)}
                    </p>
                    {!liquidado && (
                      <p className={`text-sm ${status === "vencido" ? "text-danger font-medium" : "text-danger"}`}>
                        Pendiente: {formatCurrency(pendiente)}
                      </p>
                    )}
                    {liquidado && (
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-success/20 text-success">
                        Liquidado
                      </span>
                    )}
                  </div>
                </div>

                {/* Payment history */}
                {venta.abonos.length > 0 && (
                  <div className="mb-3">
                    <button
                      onClick={() => setExpandedVenta(isExpanded ? null : venta.id)}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {venta.abonos.length} abono{venta.abonos.length !== 1 ? "s" : ""} registrado{venta.abonos.length !== 1 ? "s" : ""}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 ml-5 space-y-2">
                        {venta.abonos.map((abono, idx) => (
                          <div
                            key={abono.id}
                            className="flex items-center justify-between text-sm py-2 px-3 bg-surface rounded-md"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-muted">{formatShortDate(abono.fecha)}</span>
                              <span className="font-mono text-success">
                                +{formatCurrency(abono.monto)}
                              </span>
                              {abono.notas && (
                                <span className="text-muted text-xs">({abono.notas})</span>
                              )}
                            </div>
                            <span className="text-muted text-xs">
                              Saldo: {formatCurrency(abono.saldo_restante)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!liquidado && (
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm text-muted">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={pendiente}
                        value={montoAbono[venta.id] || ""}
                        onChange={(e) =>
                          setMontoAbono((prev) => ({
                            ...prev,
                            [venta.id]: e.target.value,
                          }))
                        }
                        placeholder="Monto abono"
                        className="flex-1 px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={() => handleAbonar(venta.id)}
                        disabled={
                          liquidando === venta.id ||
                          !montoAbono[venta.id] ||
                          parseFloat(montoAbono[venta.id]) <= 0
                        }
                        className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-light disabled:opacity-50"
                      >
                        Abonar
                      </button>
                    </div>
                    <button
                      onClick={() => handleLiquidarTotal(venta.id)}
                      disabled={liquidando === venta.id}
                      className="px-3 py-1.5 text-sm border border-success text-success rounded-md hover:bg-success/10 disabled:opacity-50"
                    >
                      {liquidando === venta.id
                        ? "..."
                        : `Liquidar ${formatCurrency(pendiente)}`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border p-12 text-center">
          <p className="text-muted mb-4">
            Este cliente no tiene ventas a crédito registradas.
          </p>
          <Link
            href="/ventas/credito"
            className="inline-block px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light"
          >
            Registrar venta a crédito
          </Link>
        </div>
      )}
    </div>
  );
}
