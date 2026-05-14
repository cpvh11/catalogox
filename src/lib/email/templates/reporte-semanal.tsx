import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Link,
} from "@react-email/components";

interface ReporteSemanalProps {
  nombreNegocio: string;
  fechaInicio: string;
  fechaFin: string;
  totalVentas: number;
  totalCosto: number;
  ganancia: number;
  margenPromedio: number;
  productosVendidos: number;
  topProductos: { nombre: string; cantidad: number; total: number }[];
  fiadoPendiente: number;
  clientesConDeuda: number;
}

export function ReporteSemanalEmail({
  nombreNegocio,
  fechaInicio,
  fechaFin,
  totalVentas,
  totalCosto,
  ganancia,
  margenPromedio,
  productosVendidos,
  topProductos,
  fiadoPendiente,
  clientesConDeuda,
}: ReporteSemanalProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);

  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Heading style={logoStyle}>CatalogoX</Heading>
            <Text style={headerTextStyle}>Reporte Semanal</Text>
          </Section>

          {/* Greeting */}
          <Section style={sectionStyle}>
            <Heading as="h2" style={h2Style}>
              Hola, {nombreNegocio}
            </Heading>
            <Text style={textStyle}>
              Aquí está el resumen de tu negocio del {fechaInicio} al {fechaFin}.
            </Text>
          </Section>

          <Hr style={hrStyle} />

          {/* Stats Grid */}
          <Section style={sectionStyle}>
            <Heading as="h3" style={h3Style}>
              Resumen Financiero
            </Heading>

            <table style={statsTableStyle}>
              <tbody>
                <tr>
                  <td style={statCellStyle}>
                    <Text style={statLabelStyle}>Total Ventas</Text>
                    <Text style={statValueStyle}>{formatCurrency(totalVentas)}</Text>
                  </td>
                  <td style={statCellStyle}>
                    <Text style={statLabelStyle}>Costo</Text>
                    <Text style={statValueStyle}>{formatCurrency(totalCosto)}</Text>
                  </td>
                </tr>
                <tr>
                  <td style={statCellStyle}>
                    <Text style={statLabelStyle}>Ganancia</Text>
                    <Text style={{ ...statValueStyle, color: ganancia >= 0 ? "#059669" : "#DC2626" }}>
                      {formatCurrency(ganancia)}
                    </Text>
                  </td>
                  <td style={statCellStyle}>
                    <Text style={statLabelStyle}>Margen Promedio</Text>
                    <Text style={statValueStyle}>{margenPromedio.toFixed(1)}%</Text>
                  </td>
                </tr>
              </tbody>
            </table>

            <Text style={smallTextStyle}>
              Productos vendidos esta semana: {productosVendidos}
            </Text>
          </Section>

          <Hr style={hrStyle} />

          {/* Top Products */}
          {topProductos.length > 0 && (
            <Section style={sectionStyle}>
              <Heading as="h3" style={h3Style}>
                Productos Más Vendidos
              </Heading>

              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Producto</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Cantidad</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductos.map((producto, index) => (
                    <tr key={index}>
                      <td style={tdStyle}>{producto.nombre}</td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>{producto.cantidad}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        {formatCurrency(producto.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          <Hr style={hrStyle} />

          {/* Fiado */}
          <Section style={sectionStyle}>
            <Heading as="h3" style={h3Style}>
              Cobros Pendientes (Fiado)
            </Heading>

            {fiadoPendiente > 0 ? (
              <>
                <Text style={textStyle}>
                  Tienes{" "}
                  <strong style={{ color: "#DC2626" }}>
                    {formatCurrency(fiadoPendiente)}
                  </strong>{" "}
                  pendientes de cobro de {clientesConDeuda} cliente
                  {clientesConDeuda !== 1 ? "s" : ""}.
                </Text>
                <Text style={smallTextStyle}>
                  Recuerda dar seguimiento a tus clientes para recuperar estos pagos.
                </Text>
              </>
            ) : (
              <Text style={{ ...textStyle, color: "#059669" }}>
                ¡Excelente! No tienes cobros pendientes.
              </Text>
            )}
          </Section>

          <Hr style={hrStyle} />

          {/* CTA */}
          <Section style={{ ...sectionStyle, textAlign: "center" }}>
            <Link href="https://catalogox.com/dashboard" style={buttonStyle}>
              Ver Dashboard Completo
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Este reporte se genera automáticamente cada domingo.
            </Text>
            <Text style={footerTextStyle}>
              © {new Date().getFullYear()} CatalogoX. Todos los derechos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const bodyStyle = {
  backgroundColor: "#f9fafb",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const containerStyle = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  maxWidth: "600px",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
};

const headerStyle = {
  backgroundColor: "#1B4D3E",
  padding: "32px 24px",
  textAlign: "center" as const,
};

const logoStyle = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
};

const headerTextStyle = {
  color: "rgba(255, 255, 255, 0.8)",
  fontSize: "14px",
  margin: "0",
};

const sectionStyle = {
  padding: "24px",
};

const h2Style = {
  color: "#111827",
  fontSize: "20px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const h3Style = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px 0",
};

const textStyle = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
};

const smallTextStyle = {
  color: "#6B7280",
  fontSize: "12px",
  margin: "8px 0 0 0",
};

const hrStyle = {
  borderColor: "#E5E7EB",
  margin: "0",
};

const statsTableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const statCellStyle = {
  padding: "12px",
  width: "50%",
  backgroundColor: "#F9FAFB",
  borderRadius: "4px",
};

const statLabelStyle = {
  color: "#6B7280",
  fontSize: "12px",
  margin: "0 0 4px 0",
};

const statValueStyle = {
  color: "#111827",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0",
  fontFamily: "monospace",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const thStyle = {
  backgroundColor: "#F9FAFB",
  color: "#6B7280",
  fontSize: "12px",
  fontWeight: "500",
  padding: "8px 12px",
  textAlign: "left" as const,
  borderBottom: "1px solid #E5E7EB",
};

const tdStyle = {
  color: "#374151",
  fontSize: "14px",
  padding: "12px",
  borderBottom: "1px solid #E5E7EB",
};

const buttonStyle = {
  backgroundColor: "#1B4D3E",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};

const footerStyle = {
  backgroundColor: "#F9FAFB",
  padding: "24px",
  textAlign: "center" as const,
};

const footerTextStyle = {
  color: "#6B7280",
  fontSize: "12px",
  margin: "0 0 4px 0",
};

export default ReporteSemanalEmail;
