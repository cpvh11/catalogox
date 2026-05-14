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
  email: string | null;
  notas: string | null;
  created_at: string;
}

interface VentaFiado {
  id: string;
  descripcion: string;
  monto: number;
  pagado: number;
  fecha: string;
}

export default function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [ventas, setVentas] = useState<VentaFiado[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    params.then((p) => setClienteId(p.id));
  }, [params]);

  useEffect(() => {
    if (!clienteId) return;

    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Try to find in clientes table first
      let { data: clienteData } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", clienteId)
        .eq("user_id", user.id)
        .single();

      // If not found, check clientes_fiado
      if (!clienteData) {
        const { data: fiadoCliente } = await supabase
          .from("clientes_fiado")
          .select("*")
          .eq("id", clienteId)
          .eq("user_id", user.id)
          .single();

        if (fiadoCliente) {
          clienteData = {
            ...fiadoCliente,
            email: null,
          };
        }
      }

      if (!clienteData) {
        router.push("/clientes");
        return;
      }

      setCliente(clienteData);
      setNombre(clienteData.nombre);
      setTelefono(clienteData.telefono || "");
      setEmail(clienteData.email || "");
      setNotas(clienteData.notas || "");

      // Get ventas from clientes_fiado if this client has fiado
      const { data: ventasData } = await supabase
        .from("ventas_fiado")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("fecha", { ascending: false });

      setVentas((ventasData as VentaFiado[]) || []);
      setLoading(false);
    }

    loadData();
  }, [clienteId, supabase, router]);

  async function handleSave() {
    if (!cliente) return;
    setSaving(true);

    const { error } = await supabase
      .from("clientes")
      .update({
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        notas: notas.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cliente.id);

    if (!error) {
      setCliente({
        ...cliente,
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        notas: notas.trim() || null,
      });
      setEditing(false);
    }
    setSaving(false);
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const totalComprado = ventas.reduce((sum, v) => sum + Number(v.monto), 0);
  const saldoPendiente = ventas.reduce(
    (sum, v) => sum + (Number(v.monto) - Number(v.pagado)),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted">Cargando...</div>
      </div>
    );
  }

  if (!cliente) return null;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link
          href="/clientes"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Volver a clientes
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-border p-6 mb-6">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Notas
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-light disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setNombre(cliente.nombre);
                  setTelefono(cliente.telefono || "");
                  setEmail(cliente.email || "");
                  setNotas(cliente.notas || "");
                }}
                className="px-4 py-2 border border-border rounded-md text-sm hover:bg-surface"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {cliente.nombre}
              </h1>
              <div className="mt-2 space-y-1 text-muted">
                {cliente.telefono && (
                  <p>
                    <a
                      href={`tel:${cliente.telefono}`}
                      className="hover:text-primary"
                    >
                      {cliente.telefono}
                    </a>
                  </p>
                )}
                {cliente.email && (
                  <p>
                    <a
                      href={`mailto:${cliente.email}`}
                      className="hover:text-primary"
                    >
                      {cliente.email}
                    </a>
                  </p>
                )}
                <p className="text-sm">
                  Cliente desde {formatDate(cliente.created_at)}
                </p>
              </div>
              {cliente.notas && (
                <p className="mt-3 text-sm text-muted bg-surface p-3 rounded-md">
                  {cliente.notas}
                </p>
              )}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-surface"
            >
              Editar
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-sm text-muted">Total comprado</p>
          <p className="text-xl font-mono font-semibold text-foreground">
            {formatCurrency(totalComprado)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-sm text-muted">Compras a crédito</p>
          <p className="text-xl font-mono font-semibold text-foreground">
            {ventas.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-sm text-muted">Saldo pendiente</p>
          <p
            className={`text-xl font-mono font-semibold ${saldoPendiente > 0 ? "text-danger" : "text-success"}`}
          >
            {formatCurrency(saldoPendiente)}
          </p>
        </div>
      </div>

      {ventas.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Historial de ventas a crédito
          </h2>
          <div className="bg-white rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted">
                    Fecha
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted">
                    Descripción
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-muted">
                    Monto
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-muted">
                    Pagado
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-muted">
                    Pendiente
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ventas.map((venta) => {
                  const pendiente = Number(venta.monto) - Number(venta.pagado);
                  return (
                    <tr key={venta.id} className="hover:bg-surface/50">
                      <td className="px-6 py-4 text-muted">
                        {formatDate(venta.fecha)}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {venta.descripcion || "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        {formatCurrency(venta.monto)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-success">
                        {formatCurrency(venta.pagado)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        {pendiente > 0 ? (
                          <span className="text-danger">
                            {formatCurrency(pendiente)}
                          </span>
                        ) : (
                          <span className="text-success">$0.00</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {ventas.length === 0 && (
        <div className="bg-white rounded-lg border border-border p-8 text-center">
          <p className="text-muted">
            Este cliente no tiene ventas a crédito registradas.
          </p>
        </div>
      )}
    </div>
  );
}
