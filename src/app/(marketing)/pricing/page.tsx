import Link from "next/link";

const plans = [
  {
    name: "Gratis",
    price: "$0",
    period: "para siempre",
    description: "Perfecto para empezar",
    features: [
      "Hasta 10 productos",
      "1 catálogo digital",
      "Dashboard básico",
      "Compartir por WhatsApp",
    ],
    limitations: [
      "Sin control de fiado",
      "Sin reportes por email",
      "Marca de agua en catálogo",
    ],
    cta: "Empieza gratis",
    href: "/auth/registro",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$299",
    period: "MXN/mes",
    description: "Para negocios en crecimiento",
    features: [
      "Productos ilimitados",
      "Catálogos ilimitados",
      "Dashboard completo",
      "Control de ventas a crédito (fiado)",
      "Reportes semanales por email",
      "Sin marca de agua",
      "Soporte prioritario",
    ],
    limitations: [],
    cta: "Upgrade a Pro",
    href: "/auth/registro?plan=pro",
    highlighted: true,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">CX</span>
            </div>
            <span className="text-lg font-semibold text-foreground">
              CatalogoX
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm text-muted hover:text-foreground"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/auth/registro"
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-light"
            >
              Empieza gratis
            </Link>
          </nav>
        </div>
      </header>

      <main className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground">
              Precios simples y transparentes
            </h1>
            <p className="mt-4 text-lg text-muted">
              Empieza gratis, actualiza cuando lo necesites
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg border p-8 ${
                  plan.highlighted
                    ? "border-primary bg-primary/5"
                    : "border-border bg-white"
                }`}
              >
                {plan.highlighted && (
                  <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-medium rounded-full mb-4">
                    Más popular
                  </span>
                )}
                <h2 className="text-2xl font-bold text-foreground">
                  {plan.name}
                </h2>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted ml-2">{plan.period}</span>
                </div>
                <p className="mt-2 text-muted">{plan.description}</p>

                <Link
                  href={plan.href}
                  className={`mt-6 block w-full py-3 px-4 rounded-md font-medium text-center ${
                    plan.highlighted
                      ? "bg-primary text-white hover:bg-primary-light"
                      : "bg-surface text-foreground border border-border hover:bg-border/50"
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-success flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-muted flex-shrink-0 mt-0.5"
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
                      <span className="text-muted">{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-muted">
              ¿Tienes preguntas?{" "}
              <a
                href="mailto:hola@catalogox.com"
                className="text-primary hover:underline"
              >
                Escríbenos
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted">
          © 2024 CatalogoX. Hecho con cariño en México.
        </div>
      </footer>
    </div>
  );
}
