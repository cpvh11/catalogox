export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
          plan: "free" | "pro";
          mp_customer_id: string | null;
          mp_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nombre_negocio?: string | null;
          slug?: string | null;
          descripcion?: string | null;
          logo_url?: string | null;
          color_primario?: string;
          whatsapp?: string | null;
          instagram?: string | null;
          facebook?: string | null;
          horario?: string | null;
          plan?: "free" | "pro";
          mp_customer_id?: string | null;
          mp_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre_negocio?: string | null;
          slug?: string | null;
          descripcion?: string | null;
          logo_url?: string | null;
          color_primario?: string;
          whatsapp?: string | null;
          instagram?: string | null;
          facebook?: string | null;
          horario?: string | null;
          plan?: "free" | "pro";
          mp_customer_id?: string | null;
          mp_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      productos: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          nombre: string;
          descripcion?: string | null;
          costo?: number;
          precio_menudeo?: number;
          precio_mayoreo?: number | null;
          stock?: number;
          imagen_url?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nombre?: string;
          descripcion?: string | null;
          costo?: number;
          precio_menudeo?: number;
          precio_mayoreo?: number | null;
          stock?: number;
          imagen_url?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      catalogos: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          tipo_precio: "menudeo" | "mayoreo";
          slug: string;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nombre: string;
          tipo_precio: "menudeo" | "mayoreo";
          slug: string;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nombre?: string;
          tipo_precio?: "menudeo" | "mayoreo";
          slug?: string;
          activo?: boolean;
          created_at?: string;
        };
      };
      catalogo_productos: {
        Row: {
          catalogo_id: string;
          producto_id: string;
          orden: number;
        };
        Insert: {
          catalogo_id: string;
          producto_id: string;
          orden?: number;
        };
        Update: {
          catalogo_id?: string;
          producto_id?: string;
          orden?: number;
        };
      };
      clientes_fiado: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          telefono: string | null;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nombre: string;
          telefono?: string | null;
          notas?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nombre?: string;
          telefono?: string | null;
          notas?: string | null;
          created_at?: string;
        };
      };
      ventas_fiado: {
        Row: {
          id: string;
          user_id: string;
          cliente_id: string;
          descripcion: string | null;
          monto: number;
          pagado: number;
          fecha: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cliente_id: string;
          descripcion?: string | null;
          monto: number;
          pagado?: number;
          fecha?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cliente_id?: string;
          descripcion?: string | null;
          monto?: number;
          pagado?: number;
          fecha?: string;
          created_at?: string;
        };
      };
      pagos_fiado: {
        Row: {
          id: string;
          venta_id: string;
          monto: number;
          fecha: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          venta_id: string;
          monto: number;
          fecha?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          venta_id?: string;
          monto?: number;
          fecha?: string;
          created_at?: string;
        };
      };
    };
  };
}
