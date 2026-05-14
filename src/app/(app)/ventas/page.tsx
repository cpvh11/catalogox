import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface VentaFiadoPendiente {
  id: string;
  cliente_id: string;
  cliente_nombre: string;
  descripcion: string;
  monto: number;
  pagado: number;
  fecha: string;
  fecha_liquidacion: string | null;
}

export default async function VentasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get pending credit sales with client info
  const { data: ventasFiado } = await supabase
    .from("ventas_fiado")
    .select(
      `
      id,
      cliente_id,
      descripcion,
      monto,
      pagado,
      fecha,
      fecha_liquidacion,
      clientes_fiado (nombre)
    `
    )
    .eq("user_id", user.id)
    .order("fecha_liquidacion", { ascending: true, nullsFirst: false });

  // Filter only pending (not fully paid)
  const pendientes: VentaFiadoPendiente[] = (ventasFiado || [])
    .filter((v) => Number(v.monto) - Number(v.pagado) > 0)
    .map((v) => ({
      id: v.id,
      cliente_id: v.cliente_id,
      cliente_nombre: (v.clientes_fiado as unknown as { nombre: string } | null)?.nombre || "Cliente",
      descripcion: v.descripcion || "Venta a crédito",
      monto: Number(v.monto),
      pagado: Number(v.pagado),
      fecha: v.fecha,
      fecha_liquidacion: v.fecha_liquidacion,
    }));

  // Sort: overdue first, then by fecha_liquidacion, then by fecha
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  pendientes.sort((a, b) => {
    const aDate = a.fecha_liquidacion ? new Date(a.fecha_liquidacion) : null;
    const bDate = b.fecha_liquidacion ? new Date(b.fecha_liquidacion) : null;

    // Items with fecha_liquidacion come first
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    if (!aDate && !bDate) return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();

    return aDate!.getTime() - bDate!.getTime();
  });

  const totalPendiente = pendientes.reduce((sum, v) => sum + (v.monto - v.pagado), 0);
  const vencidos = pendientes.filter((v) => {
    if (!v.fecha_liquidacion) return false;
    return new Date(v.fecha_liquidacion) < today;
  });
  const porVencer = pendientes.filter((v) => {
    if (!v.fecha_liquidacion) return false;
    const fecha = new Date(v.fecha_liquidacion);
    return fecha >= today && fecha <= in7Days;
  });

  function getStatus(fechaLiquidacion: string | null): "vencido" | "proximo" | "normal" {
    if (!fechaLiquidacion) return "normal";
    const fecha = new Date(fechaLiquidacion);
    if (fecha < today) return "vencido";
    if (fecha <= in7Days) return "proximo";
    return "normal";
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
    });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Ventas</h1>
        <p className="text-muted mt-1">Registra ventas y gestiona cobros pendientes</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/ventas/nueva"
          className="block p-6 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold">Venta Rápida</p>
              <p className="text-white/80 text-sm">Pago en efectivo inmediato</p>
            </div>
          </div>
        </Link>

        <Link
          href="/ventas/credito"
          className="block p-6 bg-white border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Venta a Crédito</p>
              <p className="text-muted text-sm">Fiado con fecha de pago acordada</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Por Cobrar Section */}
      <div className="bg-white rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Por Cobrar</h2>
              <p className="text-sm text-muted mt-1">
                {pendientes.length} venta{pendientes.length !== 1 ? "s" : ""} pendiente{pendientes.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted">Total pendiente</p>
              <p className="text-2xl font-mono font-bold text-danger">
                {formatCurrency(totalPendiente)}
              </p>
            </div>
          </div>

          {(vencidos.length > 0 || porVencer.length > 0) && (
            <div className="flex gap-4 mt-4">
              {vencidos.length > 0 && (
                <div className="px-3 py-1 rounded-full bg-danger/10 text-danger text-sm">
                  {vencidos.length} vencido{vencidos.length !== 1 ? "s" : ""}
                </div>
              )}
              {porVencer.length > 0 && (
                <div className="px-3 py-1 rounded-full bg-warning/10 text-warning text-sm">
                  {porVencer.length} por vencer
                </div>
              )}
            </div>
          )}
        </div>

        {pendientes.length > 0 ? (
          <div className="divide-y divide-border">
            {pendientes.map((venta) => {
              const pendiente = venta.monto - venta.pagado;
              const status = getStatus(venta.fecha_liquidacion);

              return (
                <Link
                  key={venta.id}
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
                      <p className="font-medium text-foreground">{venta.cliente_nombre}</p>
                      <p className="text-sm text-muted">{venta.descripcion}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                        <span>Venta: {formatDate(venta.fecha)}</span>
                        {venta.fecha_liquidacion && (
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
                      <p
                        className={`font-mono font-semibold ${
                          status === "vencido" ? "text-danger" : "text-foreground"
                        }`}
                      >
                        {formatCurrency(pendiente)}
                      </p>
                      {venta.pagado > 0 && (
                        <p className="text-xs text-success">
                          Abonado: {formatCurrency(venta.pagado)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 mx-auto flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Sin cobros pendientes</h3>
            <p className="text-muted">Todas tus ventas a crédito están liquidadas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
