"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";

export default function ConfiguracionNegocioPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [nombreNegocio, setNombreNegocio] = useState("");
  const [slug, setSlug] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [colorPrimario, setColorPrimario] = useState("#1B4D3E");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [horario, setHorario] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setNombreNegocio(data.nombre_negocio || "");
        setSlug(data.slug || "");
        setDescripcion(data.descripcion || "");
        setColorPrimario(data.color_primario || "#1B4D3E");
        setWhatsapp(data.whatsapp || "");
        setInstagram(data.instagram || "");
        setFacebook(data.facebook || "");
        setHorario(data.horario || "");
      }
      setLoading(false);
    }

    loadProfile();
  }, [supabase]);

  function handleNombreChange(value: string) {
    setNombreNegocio(value);
    if (!slug || slug === generateSlug(nombreNegocio)) {
      setSlug(generateSlug(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("No autenticado");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        nombre_negocio: nombreNegocio || null,
        slug: slug || null,
        descripcion: descripcion || null,
        color_primario: colorPrimario,
        whatsapp: whatsapp || null,
        instagram: instagram || null,
        facebook: facebook || null,
        horario: horario || null,
      })
      .eq("id", user.id);

    if (updateError) {
      if (updateError.code === "23505") {
        setError("Este slug ya está en uso. Elige otro.");
      } else {
        setError(updateError.message);
      }
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link
          href="/configuracion"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Volver a configuración
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mt-2">
          Mi negocio
        </h1>
        <p className="text-muted mt-1">
          Personaliza cómo se ve tu catálogo público
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-danger/10 text-danger text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-md bg-success/10 text-success text-sm">
          Cambios guardados correctamente
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-border p-6 space-y-4">
          <h2 className="font-medium text-foreground">Información básica</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nombre del negocio
            </label>
            <input
              type="text"
              value={nombreNegocio}
              onChange={(e) => handleNombreChange(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Mi Tienda"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              URL del catálogo
            </label>
            <div className="flex items-center gap-2">
              <span className="text-muted text-sm">catalogox.com/c/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="mi-tienda"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Descripción corta
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value.slice(0, 280))}
              rows={3}
              maxLength={280}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Describe tu negocio en pocas palabras..."
            />
            <p className="text-xs text-muted mt-1">{descripcion.length}/280</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Color principal
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorPrimario}
                onChange={(e) => setColorPrimario(e.target.value)}
                className="w-10 h-10 border border-border rounded cursor-pointer"
              />
              <input
                type="text"
                value={colorPrimario}
                onChange={(e) => setColorPrimario(e.target.value)}
                className="w-28 px-3 py-2 border border-border rounded-md font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-6 space-y-4">
          <h2 className="font-medium text-foreground">Redes sociales</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              WhatsApp
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="+52 55 1234 5678"
            />
            <p className="text-xs text-muted mt-1">
              Incluye código de país para link directo
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Instagram
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-surface border border-r-0 border-border rounded-l-md text-muted">
                @
              </span>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value.replace("@", ""))}
                className="flex-1 px-3 py-2 border border-border rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="mi_tienda"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Facebook
            </label>
            <input
              type="text"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="facebook.com/mitienda o @mitienda"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Horario de atención
            </label>
            <input
              type="text"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Lun-Vie 9am-6pm, Sáb 10am-2pm"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-light disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <Link
            href="/configuracion"
            className="px-6 py-2 border border-border rounded-md font-medium hover:bg-surface"
          >
            Cancelar
          </Link>
        </div>
      </form>

      {slug && (
        <div className="mt-8 p-4 bg-surface rounded-lg border border-border">
          <p className="text-sm text-muted">
            Tu catálogo estará disponible en:
          </p>
          <p className="text-primary font-medium mt-1">
            catalogox.com/c/{slug}
          </p>
        </div>
      )}
    </div>
  );
}
