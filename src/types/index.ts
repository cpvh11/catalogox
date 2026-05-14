export type Plan = "free" | "pro";

export interface Profile {
  id: string;
  nombre_negocio: string | null;
  slug: string | null;
  descripcion: string | null;
  logo_url: string | null;
  color_primario: string;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  horario: string | null;
  plan: Plan;
  mp_customer_id: string | null;
  mp_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Producto {
  id: string;
  user_id: string;
  nombre: string;
  descripcion: string | null;
  costo: number;
  precio_menudeo: number;
  precio_mayoreo: number | null;
  stock: number;
  imagen_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Catalogo {
  id: string;
  user_id: string;
  nombre: string;
  tipo_precio: "menudeo" | "mayoreo";
  slug: string;
  activo: boolean;
  created_at: string;
}

export interface CatalogoProducto {
  catalogo_id: string;
  producto_id: string;
  orden: number;
}

export interface ClienteFiado {
  id: string;
  user_id: string;
  nombre: string;
  telefono: string | null;
  notas: string | null;
  created_at: string;
}

export interface VentaFiado {
  id: string;
  user_id: string;
  cliente_id: string;
  descripcion: string | null;
  monto: number;
  pagado: number;
  fecha: string;
  created_at: string;
}

export interface PagoFiado {
  id: string;
  venta_id: string;
  monto: number;
  fecha: string;
  created_at: string;
}
