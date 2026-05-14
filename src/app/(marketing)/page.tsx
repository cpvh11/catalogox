import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">CX</span>
            </div>
            <span className="text-lg font-semibold text-foreground">
              CatalogoX
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm text-muted hover:text-foreground"
            >
              Precios
            </Link>
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

      <main>
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Tu negocio de reventa,
              <br />
              <span className="text-primary">profesional y organizado</span>
            </h1>
            <p className="mt-6 text-lg text-muted max-w-2xl mx-auto">
              Gestiona productos, genera catálogos digitales para WhatsApp,
              controla ventas a crédito y visualiza tus finanzas. Todo en un
              solo lugar.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/registro"
                className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary-light"
              >
                Empieza gratis
              </Link>
              <Link
                href="/pricing"
                className="px-6 py-3 border border-border text-foreground rounded-md font-medium hover:bg-surface"
              >
                Ver precios
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 bg-surface">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground text-center mb-12">
              Todo lo que necesitas para vender más
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                title="Catálogos digitales"
                description="Genera catálogos profesionales con tu marca para compartir por WhatsApp en segundos."
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                }
              />
              <FeatureCard
                title="Control de inventario"
                description="Registra costos, precios y márgenes. Calcula automáticamente tu utilidad por producto."
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                }
              />
              <FeatureCard
                title="Ventas a crédito"
                description="Registra quién te debe, cuánto y desde cuándo. Nunca más pierdas dinero por olvidos."
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                }
              />
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Empieza hoy, es gratis
            </h2>
            <p className="text-muted mb-8">
              Sin tarjeta de crédito. Hasta 10 productos gratis.
            </p>
            <Link
              href="/auth/registro"
              className="inline-block px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary-light"
            >
              Crear mi cuenta gratis
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted">
          © 2024 CatalogoX. Hecho con cariño en México.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 rounded-lg border border-border">
      <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted">{description}</p>
    </div>
  );
}
