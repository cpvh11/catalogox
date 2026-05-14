"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface ClienteConStats {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  created_at: string;
  ultima_venta: string | null;
  total_comprado: number;
  saldo_pendiente: number;
}

type Filtro = "todos" | "con_deuda" | "sin_deuda";

export default function ClientesPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [allClientes, setAllClientes] = useState<ClienteConStats[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todos");

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [clientesRes, ventasFiadoRes, clientesFiadoRes] = await Promise.all([
        supabase.from("clientes").select("*").eq("user_id", user.id).order("nombre"),
        supabase
          .from("ventas_fiado")
          .select("cliente_id, monto, pagado, fecha")
          .eq("user_id", user.id),
        supabase.from("clientes_fiado").select("*").eq("user_id", user.id),
      ]);

      const clientes = clientesRes.data || [];
      const ventasFiado = ventasFiadoRes.data || [];
      const clientesFiado = clientesFiadoRes.data || [];

      const fiadoStatsByClienteId = new Map<
        string,
        { total: number; pendiente: number; ultimaVenta: string | null }
      >();

      for (const venta of ventasFiado) {
        const stats = fiadoStatsByClienteId.get(venta.cliente_id) || {
          total: 0,
          pendiente: 0,
          ultimaVenta: null,
        };
        stats.total += Number(venta.monto);
        stats.pendiente += Number(venta.monto) - Number(venta.pagado);
        if (!stats.ultimaVenta || venta.fecha > stats.ultimaVenta) {
          stats.ultimaVenta = venta.fecha;
        }
        fiadoStatsByClienteId.set(venta.cliente_id, stats);
      }

      const combined: ClienteConStats[] = [];

      for (const cliente of clientes) {
        combined.push({
          id: cliente.id,
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          email: cliente.email,
          notas: cliente.notas,
          created_at: cliente.created_at,
          ultima_venta: null,
          total_comprado: 0,
          saldo_pendiente: 0,
        });
      }

      const existingNames = new Set(combined.map((c) => c.nombre.toLowerCase()));
      for (const cliente of clientesFiado) {
        if (!existingNames.has(cliente.nombre.toLowerCase())) {
          const stats = fiadoStatsByClienteId.get(cliente.id);
          combined.push({
            id: cliente.id,
            nombre: cliente.nombre,
            telefono: cliente.telefono,
            email: null,
            notas: cliente.notas,
            created_at: cliente.created_at,
            ultima_venta: stats?.ultimaVenta || null,
            total_comprado: stats?.total || 0,
            saldo_pendiente: stats?.pendiente || 0,
          });
        }
      }

      combined.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setAllClientes(combined);
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  const clientesFiltrados = useMemo(() => {
    switch (filtro) {
      case "con_deuda":
        return allClientes.filter((c) => c.saldo_pendiente > 0);
      case "sin_deuda":
        return allClientes.filter((c) => c.saldo_pendiente <= 0);
      default:
        return allClientes;
    }
  }, [allClientes, filtro]);

  const totalClientes = allClientes.length;
  const clientesConDeuda = allClientes.filter((c) => c.saldo_pendiente > 0).length;
  const clientesSinDeuda = allClientes.filter((c) => c.saldo_pendiente <= 0).length;

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
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
          <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
          <p className="text-muted mt-1">
            {totalClientes} cliente{totalClientes !== 1 ? "s" : ""} registrado
            {totalClientes !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/clientes/nuevo"
          className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light"
        >
          + Agregar cliente
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFiltro("todos")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filtro === "todos"
              ? "bg-primary text-white"
              : "bg-surface text-foreground hover:bg-border/50"
          }`}
        >
          Todos ({totalClientes})
        </button>
        <button
          onClick={() => setFiltro("con_deuda")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filtro === "con_deuda"
              ? "bg-danger text-white"
              : "bg-surface text-foreground hover:bg-border/50"
          }`}
        >
          Con saldo pendiente ({clientesConDeuda})
        </button>
        <button
          onClick={() => setFiltro("sin_deuda")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filtro === "sin_deuda"
              ? "bg-success text-white"
              : "bg-surface text-foreground hover:bg-border/50"
          }`}
        >
          Sin deuda ({clientesSinDeuda})
        </button>
      </div>

      {clientesFiltrados.length > 0 ? (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted">
                    Nombre
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted">
                    Teléfono
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted">
                    Primer contacto
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted">
                    Última venta
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-muted">
                    Total comprado
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-muted">
                    Saldo pendiente
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-surface/50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/clientes/${cliente.id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {cliente.nombre}
                      </Link>
                      {cliente.email && (
                        <p className="text-xs text-muted">{cliente.email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {cliente.telefono ? (
                        <a
                          href={`tel:${cliente.telefono}`}
                          className="hover:text-primary"
                        >
                          {cliente.telefono}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {formatDate(cliente.created_at)}
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {formatDate(cliente.ultima_venta)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {cliente.total_comprado > 0
                        ? formatCurrency(cliente.total_comprado)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {cliente.saldo_pendiente > 0 ? (
                        <span className="font-mono font-semibold text-danger">
                          {formatCurrency(cliente.saldo_pendiente)}
                        </span>
                      ) : (
                        <span className="text-success text-sm">Al día</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : allClientes.length > 0 ? (
        <div className="bg-white rounded-lg border border-border p-12 text-center">
          <p className="text-muted">
            No hay clientes que coincidan con el filtro seleccionado.
          </p>
          <button
            onClick={() => setFiltro("todos")}
            className="mt-4 text-primary hover:underline"
          >
            Ver todos los clientes
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Sin clientes registrados
          </h3>
          <p className="text-muted mb-6 max-w-md mx-auto">
            Agrega tu primer cliente para empezar a llevar un registro de tus
            ventas y relaciones comerciales.
          </p>
          <Link
            href="/clientes/nuevo"
            className="inline-block px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light"
          >
            Agregar primer cliente
          </Link>
        </div>
      )}
    </div>
  );
}
