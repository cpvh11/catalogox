"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface VentaEfectivo {
  id: string;
  tipo: "efectivo";
  cliente_nombre: string | null;
  total: number;
  costo_total: number;
  fecha: string;
  notas: string | null;
}

interface VentaCredito {
  id: string;
  tipo: "credito";
  cliente_id: string;
  cliente_nombre: string;
  descripcion: string;
  monto: number;
  pagado: number;
  fecha: string;
  fecha_liquidacion: string | null;
}

type Venta = VentaEfectivo | VentaCredito;
type Filtro = "todas" | "efectivo" | "credito" | "pendientes";

export default function VentasPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todas");

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [ventasEfectivoRes, ventasCreditoRes] = await Promise.all([
        supabase
          .from("ventas")
          .select("*")
          .eq("user_id", user.id)
          .order("fecha", { ascending: false }),
        supabase
          .from("ventas_fiado")
          .select("*, clientes_fiado(nombre)")
          .eq("user_id", user.id)
          .order("fecha", { ascending: false }),
      ]);

      const efectivo: VentaEfectivo[] = (ventasEfectivoRes.data || []).map((v: Record<string, unknown>) => ({
        id: v.id as string,
        tipo: "efectivo" as const,
        cliente_nombre: v.cliente_nombre as string | null,
        total: Number(v.total),
        costo_total: Number(v.costo_total),
        fecha: v.fecha as string,
        notas: v.notas as string | null,
      }));

      const credito: VentaCredito[] = (ventasCreditoRes.data || []).map((v: Record<string, unknown>) => ({
        id: v.id as string,
        tipo: "credito" as const,
        cliente_id: v.cliente_id as string,
        cliente_nombre: (v.clientes_fiado as { nombre: string } | null)?.nombre || "Cliente",
        descripcion: (v.descripcion as string) || "Venta a crédito",
        monto: Number(v.monto),
        pagado: Number(v.pagado),
        fecha: v.fecha as string,
        fecha_liquidacion: v.fecha_liquidacion as string | null,
      }));

      const all = [...efectivo, ...credito].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      setVentas(all);
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const stats = useMemo(() => {
    const ventasMes = ventas.filter((v) => new Date(v.fecha) >= firstOfMonth);

    let totalVendidoMes = 0;
    let totalCobradoMes = 0;
    let totalPendiente = 0;

    for (const v of ventasMes) {
      if (v.tipo === "efectivo") {
        totalVendidoMes += v.total;
        totalCobradoMes += v.total;
      } else {
        totalVendidoMes += v.monto;
        totalCobradoMes += v.pagado;
      }
    }

    for (const v of ventas) {
      if (v.tipo === "credito") {
        const pendiente = v.monto - v.pagado;
        if (pendiente > 0) {
          totalPendiente += pendiente;
        }
      }
    }

    return { totalVendidoMes, totalCobradoMes, totalPendiente };
  }, [ventas, firstOfMonth]);

  const ventasFiltradas = useMemo(() => {
    switch (filtro) {
      case "efectivo":
        return ventas.filter((v) => v.tipo === "efectivo");
      case "credito":
        return ventas.filter((v) => v.tipo === "credito");
      case "pendientes":
        return ventas.filter(
          (v) => v.tipo === "credito" && v.monto - v.pagado > 0
        );
      default:
        return ventas;
    }
  }, [ventas, filtro]);

  const counts = useMemo(() => ({
    todas: ventas.length,
    efectivo: ventas.filter((v) => v.tipo === "efectivo").length,
    credito: ventas.filter((v) => v.tipo === "credito").length,
    pendientes: ventas.filter((v) => v.tipo === "credito" && v.monto - v.pagado > 0).length,
  }), [ventas]);

  function getStatus(v: VentaCredito): "vencido" | "proximo" | "liquidado" | "normal" {
    const pendiente = v.monto - v.pagado;
    if (pendiente <= 0) return "liquidado";
    if (!v.fecha_liquidacion) return "normal";
    const fecha = new Date(v.fecha_liquidacion);
    if (fecha < today) return "vencido";
    if (fecha <= in7Days) return "proximo";
    return "normal";
  }

  function formatDate(dateStr: string): string {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Ventas</h1>
          <p className="text-muted mt-1">Registro completo de ventas</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/ventas/nueva"
            className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light"
          >
            + Venta rápida
          </Link>
          <Link
            href="/ventas/credito"
            className="px-4 py-2 border border-primary text-primary rounded-md font-medium hover:bg-primary/5"
          >
            + Crédito
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-sm text-muted">Vendido este mes</p>
          <p className="text-2xl font-mono font-semibold text-foreground">
            {formatCurrency(stats.totalVendidoMes)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-sm text-muted">Cobrado este mes</p>
          <p className="text-2xl font-mono font-semibold text-success">
            {formatCurrency(stats.totalCobradoMes)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-sm text-muted">Total por cobrar</p>
          <p className={`text-2xl font-mono font-semibold ${stats.totalPendiente > 0 ? "text-danger" : "text-success"}`}>
            {formatCurrency(stats.totalPendiente)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFiltro("todas")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filtro === "todas"
              ? "bg-primary text-white"
              : "bg-surface text-foreground hover:bg-border/50"
          }`}
        >
          Todas ({counts.todas})
        </button>
        <button
          onClick={() => setFiltro("efectivo")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filtro === "efectivo"
              ? "bg-success text-white"
              : "bg-surface text-foreground hover:bg-border/50"
          }`}
        >
          Efectivo ({counts.efectivo})
        </button>
        <button
          onClick={() => setFiltro("credito")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filtro === "credito"
              ? "bg-warning text-white"
              : "bg-surface text-foreground hover:bg-border/50"
          }`}
        >
          Crédito ({counts.credito})
        </button>
        <button
          onClick={() => setFiltro("pendientes")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filtro === "pendientes"
              ? "bg-danger text-white"
              : "bg-surface text-foreground hover:bg-border/50"
          }`}
        >
          Por cobrar ({counts.pendientes})
        </button>
      </div>

      {/* Lista de ventas */}
      {ventasFiltradas.length > 0 ? (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {ventasFiltradas.map((venta) => {
              if (venta.tipo === "efectivo") {
                return (
                  <div key={`e-${venta.id}`} className="p-4 hover:bg-surface/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-success/20 text-success">
                            Efectivo
                          </span>
                          <span className="text-sm text-muted">{formatDate(venta.fecha)}</span>
                        </div>
                        <p className="font-medium text-foreground mt-1">
                          {venta.cliente_nombre || "Venta anónima"}
                        </p>
                        {venta.notas && (
                          <p className="text-sm text-muted">{venta.notas}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold text-foreground">
                          {formatCurrency(venta.total)}
                        </p>
                        <p className="text-xs text-success">
                          Ganancia: {formatCurrency(venta.total - venta.costo_total)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              } else {
                const pendiente = venta.monto - venta.pagado;
                const status = getStatus(venta);

                return (
                  <Link
                    key={`c-${venta.id}`}
                    href={`/ventas/cliente/${venta.cliente_id}`}
                    className={`block p-4 hover:bg-surface/50 transition-colors ${
                      status === "vencido"
                        ? "bg-danger/5 border-l-4 border-l-danger"
                        : status === "proximo"
                          ? "bg-warning/5 border-l-4 border-l-warning"
                          : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                            status === "liquidado"
                              ? "bg-success/20 text-success"
                              : "bg-warning/20 text-warning"
                          }`}>
                            {status === "liquidado" ? "Pagado" : "Crédito"}
                          </span>
                          <span className="text-sm text-muted">{formatDate(venta.fecha)}</span>
                          {venta.fecha_liquidacion && pendiente > 0 && (
                            <span className={`text-xs ${
                              status === "vencido" ? "text-danger font-medium" :
                              status === "proximo" ? "text-warning" : "text-muted"
                            }`}>
                              Vence: {formatDate(venta.fecha_liquidacion)}
                              {status === "vencido" && " (VENCIDO)"}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-foreground mt-1">
                          {venta.cliente_nombre}
                        </p>
                        <p className="text-sm text-muted">{venta.descripcion}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold text-foreground">
                          {formatCurrency(venta.monto)}
                        </p>
                        {pendiente > 0 ? (
                          <p className={`text-sm font-mono ${status === "vencido" ? "text-danger font-medium" : "text-danger"}`}>
                            Debe: {formatCurrency(pendiente)}
                          </p>
                        ) : (
                          <p className="text-xs text-success">Liquidado</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              }
            })}
          </div>
        </div>
      ) : ventas.length > 0 ? (
        <div className="bg-white rounded-lg border border-border p-12 text-center">
          <p className="text-muted">
            No hay ventas que coincidan con el filtro seleccionado.
          </p>
          <button
            onClick={() => setFiltro("todas")}
            className="mt-4 text-primary hover:underline"
          >
            Ver todas las ventas
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Sin ventas registradas
          </h3>
          <p className="text-muted mb-6 max-w-md mx-auto">
            Registra tu primera venta para empezar a llevar control de tus ingresos.
          </p>
          <div className="flex gap-2 justify-center">
            <Link
              href="/ventas/nueva"
              className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light"
            >
              Venta en efectivo
            </Link>
            <Link
              href="/ventas/credito"
              className="px-4 py-2 border border-primary text-primary rounded-md font-medium hover:bg-primary/5"
            >
              Venta a crédito
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
