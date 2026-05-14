import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FiadoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro") {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-8">
          Control de Fiado
        </h1>
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Función exclusiva de Plan Pro
          </h3>
          <p className="text-muted mb-6 max-w-md mx-auto">
            El control de ventas a crédito (fiado) te permite llevar registro de
            quién te debe, cuánto y desde cuándo. Nunca más pierdas dinero por
            olvidos.
          </p>
          <Link
            href="/configuracion/suscripcion"
            className="inline-block px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light"
          >
            Upgrade a Pro
          </Link>
        </div>
      </div>
    );
  }

  const { data: clientes } = await supabase
    .from("clientes_fiado")
    .select(
      `
      *,
      ventas_fiado (
        monto,
        pagado
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const clientesConSaldo = clientes?.map((cliente) => {
    const totalDeuda = cliente.ventas_fiado.reduce(
      (sum: number, v: { monto: number; pagado: number }) =>
        sum + (Number(v.monto) - Number(v.pagado)),
      0
    );
    return { ...cliente, saldo: totalDeuda };
  });

  const totalPendiente =
    clientesConSaldo?.reduce((sum, c) => sum + c.saldo, 0) || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Control de Fiado
          </h1>
          <p className="text-muted mt-1">
            Total pendiente:{" "}
            <span className="font-mono text-danger font-semibold">
              {formatCurrency(totalPendiente)}
            </span>
          </p>
        </div>
        <Link
          href="/fiado/nuevo"
          className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light"
        >
          + Registrar venta
        </Link>
      </div>

      {clientesConSaldo && clientesConSaldo.length > 0 ? (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted">
                  Cliente
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted">
                  Teléfono
                </th>
                <th className="text-right px-6 py-3 text-sm font-medium text-muted">
                  Saldo pendiente
                </th>
                <th className="text-right px-6 py-3 text-sm font-medium text-muted">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clientesConSaldo.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-surface/50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/fiado/${cliente.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {cliente.nombre}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {cliente.telefono || "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`font-mono font-semibold ${cliente.saldo > 0 ? "text-danger" : "text-success"}`}
                    >
                      {formatCurrency(cliente.saldo)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/fiado/${cliente.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Ver historial
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border p-12 text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">
            Sin clientes registrados
          </h3>
          <p className="text-muted mb-6">
            Registra tu primera venta a crédito para empezar.
          </p>
          <Link
            href="/fiado/nuevo"
            className="inline-block px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light"
          >
            Registrar venta a crédito
          </Link>
        </div>
      )}
    </div>
  );
}
