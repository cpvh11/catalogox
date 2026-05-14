import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { PRODUCTOS_PER_PAGE } from "@/lib/constants";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_negocio, descripcion")
    .eq("slug", slug)
    .single();

  if (!profile) {
    return { title: "Catálogo no encontrado" };
  }

  return {
    title: `${profile.nombre_negocio || "Catálogo"} | CatalogoX`,
    description: profile.descripcion || `Catálogo de ${profile.nombre_negocio}`,
  };
}

export default async function CatalogoPublicoPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!profile) {
    notFound();
  }

  const { data: catalogo } = await supabase
    .from("catalogos")
    .select("*")
    .eq("user_id", profile.id)
    .eq("activo", true)
    .limit(1)
    .single();

  if (!catalogo) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Este negocio aún no tiene catálogo activo
          </h1>
          <p className="text-muted mt-2">Vuelve pronto</p>
        </div>
      </div>
    );
  }

  const currentPage = parseInt(pageParam || "1");
  const offset = (currentPage - 1) * PRODUCTOS_PER_PAGE;

  const { data: catalogoProductos, count } = await supabase
    .from("catalogo_productos")
    .select("producto_id, orden", { count: "exact" })
    .eq("catalogo_id", catalogo.id)
    .order("orden")
    .range(offset, offset + PRODUCTOS_PER_PAGE - 1);

  const productoIds = catalogoProductos?.map((cp) => cp.producto_id) || [];

  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .in("id", productoIds)
    .eq("activo", true);

  const productosOrdenados = productoIds
    .map((id) => productos?.find((p) => p.id === id))
    .filter(Boolean);

  const totalPages = Math.ceil((count || 0) / PRODUCTOS_PER_PAGE);

  const primaryColor = profile.color_primario || "#1B4D3E";

  return (
    <div className="min-h-screen bg-white">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          :root {
            --catalog-primary: ${primaryColor};
          }
        `,
        }}
      />

      {/* Header con perfil del negocio */}
      <header
        className="border-b"
        style={{ borderColor: `${primaryColor}20` }}
      >
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start gap-4">
            {profile.logo_url ? (
              <img
                src={profile.logo_url}
                alt={profile.nombre_negocio || "Logo"}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {(profile.nombre_negocio || "?")[0].toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                {profile.nombre_negocio || "Mi Catálogo"}
              </h1>
              {profile.descripcion && (
                <p className="text-muted mt-1 text-sm max-w-lg">
                  {profile.descripcion}
                </p>
              )}

              {/* Redes sociales */}
              <div className="flex flex-wrap gap-3 mt-3">
                {profile.whatsapp && (
                  <a
                    href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: "#25D366" }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
                {profile.instagram && (
                  <a
                    href={`https://instagram.com/${profile.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-full text-sm text-foreground hover:bg-border/50"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    @{profile.instagram}
                  </a>
                )}
                {profile.facebook && (
                  <a
                    href={
                      profile.facebook.startsWith("http")
                        ? profile.facebook
                        : `https://facebook.com/${profile.facebook}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-full text-sm text-foreground hover:bg-border/50"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </a>
                )}
              </div>

              {profile.horario && (
                <p className="text-sm text-muted mt-3">
                  <span className="font-medium">Horario:</span> {profile.horario}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Grid de productos */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted text-sm">
            {count} producto{count !== 1 ? "s" : ""}
          </p>
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
          >
            Precio {catalogo.tipo_precio}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {productosOrdenados.map((producto: any) => (
            <div
              key={producto.id}
              className="bg-white rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow"
            >
              {producto.imagen_url ? (
                <div className="aspect-square bg-surface">
                  <img
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-surface flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-border"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              <div className="p-3">
                <h3 className="font-medium text-foreground text-sm line-clamp-2">
                  {producto.nombre}
                </h3>
                <p
                  className="text-lg font-bold mt-1 font-mono"
                  style={{ color: primaryColor }}
                >
                  {formatCurrency(
                    catalogo.tipo_precio === "menudeo"
                      ? producto.precio_menudeo
                      : producto.precio_mayoreo || producto.precio_menudeo
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {currentPage > 1 && (
              <Link
                href={`/c/${slug}?page=${currentPage - 1}`}
                className="px-4 py-2 border border-border rounded-md hover:bg-surface"
              >
                Anterior
              </Link>
            )}
            <span className="px-4 py-2 text-muted">
              Página {currentPage} de {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={`/c/${slug}?page=${currentPage + 1}`}
                className="px-4 py-2 border border-border rounded-md hover:bg-surface"
              >
                Siguiente
              </Link>
            )}
          </div>
        )}
      </main>

      {/* Footer con marca de agua (solo plan free) */}
      {profile.plan === "free" && (
        <footer className="border-t border-border py-6 mt-8">
          <div className="text-center">
            <a
              href="/"
              className="text-sm text-muted hover:text-foreground"
            >
              Hecho con <span className="font-semibold">CatalogoX</span>
            </a>
          </div>
        </footer>
      )}
    </div>
  );
}
