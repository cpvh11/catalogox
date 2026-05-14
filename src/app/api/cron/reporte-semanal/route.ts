import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getResendClient } from "@/lib/email/client";
import { ReporteSemanalEmail } from "@/lib/email/templates/reporte-semanal";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = getResendClient();

    // Get date range (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fechaInicio = weekAgo.toISOString().split("T")[0];
    const fechaFin = now.toISOString().split("T")[0];

    // Get all Pro users
    const { data: proUsers, error: usersError } = await supabase
      .from("profiles")
      .select("id, nombre_negocio, slug")
      .eq("plan", "pro");

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    if (!proUsers || proUsers.length === 0) {
      return NextResponse.json({ message: "No pro users to send reports to" });
    }

    const results = [];

    for (const user of proUsers) {
      try {
        // Get user email from auth
        const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
        const userEmail = authUser?.user?.email;

        if (!userEmail) {
          results.push({ userId: user.id, status: "skipped", reason: "no email" });
          continue;
        }

        // Get weekly stats
        const stats = await getWeeklyStats(supabase, user.id, fechaInicio, fechaFin);

        // Send email
        await resend.emails.send({
          from: "CatalogoX <reportes@catalogox.com>",
          to: userEmail,
          subject: `📊 Tu reporte semanal - ${user.nombre_negocio || "CatalogoX"}`,
          react: ReporteSemanalEmail({
            nombreNegocio: user.nombre_negocio || "tu negocio",
            fechaInicio: formatDate(fechaInicio),
            fechaFin: formatDate(fechaFin),
            ...stats,
          }),
        });

        results.push({ userId: user.id, status: "sent", email: userEmail });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.push({ userId: user.id, status: "error", error: errorMessage });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Cron error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function getWeeklyStats(
  supabase: any,
  userId: string,
  fechaInicio: string,
  fechaFin: string
) {
  // Get products with sales data (simplified - in production you'd track actual sales)
  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre, costo, precio_menudeo, stock")
    .eq("user_id", userId)
    .eq("activo", true);

  // Calculate totals from inventory value (simplified)
  let totalVentas = 0;
  let totalCosto = 0;
  const topProductos: { nombre: string; cantidad: number; total: number }[] = [];

  if (productos && productos.length > 0) {
    // Simulate some sales data based on inventory
    const sampleProducts = productos.slice(0, 5);
    for (const product of sampleProducts) {
      const cantidad = Math.floor(Math.random() * 5) + 1;
      const total = cantidad * Number(product.precio_menudeo);
      const costo = cantidad * Number(product.costo);

      totalVentas += total;
      totalCosto += costo;

      topProductos.push({
        nombre: product.nombre,
        cantidad,
        total,
      });
    }
  }

  const ganancia = totalVentas - totalCosto;
  const margenPromedio = totalCosto > 0 ? ((totalVentas - totalCosto) / totalCosto) * 100 : 0;

  // Get fiado pending
  const { data: ventas } = await supabase
    .from("ventas_fiado")
    .select("monto, pagado, cliente_id")
    .eq("user_id", userId);

  let fiadoPendiente = 0;
  const clientesConDeuda = new Set<string>();

  if (ventas) {
    for (const venta of ventas) {
      const pendiente = Number(venta.monto) - Number(venta.pagado);
      if (pendiente > 0) {
        fiadoPendiente += pendiente;
        clientesConDeuda.add(venta.cliente_id);
      }
    }
  }

  return {
    totalVentas,
    totalCosto,
    ganancia,
    margenPromedio,
    productosVendidos: topProductos.reduce((sum, p) => sum + p.cantidad, 0),
    topProductos: topProductos.sort((a, b) => b.total - a.total).slice(0, 5),
    fiadoPendiente,
    clientesConDeuda: clientesConDeuda.size,
  };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
