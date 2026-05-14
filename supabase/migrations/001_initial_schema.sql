-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_negocio TEXT,
  slug TEXT UNIQUE,
  descripcion TEXT,
  logo_url TEXT,
  color_primario TEXT DEFAULT '#1B4D3E',
  whatsapp TEXT,
  instagram TEXT,
  facebook TEXT,
  horario TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  mp_customer_id TEXT,
  mp_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Productos table
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  costo DECIMAL(10,2) DEFAULT 0,
  precio_menudeo DECIMAL(10,2) DEFAULT 0,
  precio_mayoreo DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  imagen_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Catalogos table
CREATE TABLE catalogos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo_precio TEXT NOT NULL CHECK (tipo_precio IN ('menudeo', 'mayoreo')),
  slug TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- Junction table for catalogo-productos
CREATE TABLE catalogo_productos (
  catalogo_id UUID REFERENCES catalogos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  orden INTEGER DEFAULT 0,
  PRIMARY KEY (catalogo_id, producto_id)
);

-- Clientes fiado
CREATE TABLE clientes_fiado (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ventas a fiado
CREATE TABLE ventas_fiado (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes_fiado(id) ON DELETE CASCADE,
  descripcion TEXT,
  monto DECIMAL(10,2) NOT NULL,
  pagado DECIMAL(10,2) DEFAULT 0,
  fecha DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pagos de fiado
CREATE TABLE pagos_fiado (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venta_id UUID NOT NULL REFERENCES ventas_fiado(id) ON DELETE CASCADE,
  monto DECIMAL(10,2) NOT NULL,
  fecha DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_productos_user_id ON productos(user_id);
CREATE INDEX idx_catalogos_user_id ON catalogos(user_id);
CREATE INDEX idx_clientes_fiado_user_id ON clientes_fiado(user_id);
CREATE INDEX idx_ventas_fiado_cliente_id ON ventas_fiado(cliente_id);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_fiado ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_fiado ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_fiado ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can CRUD own productos" ON productos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own catalogos" ON catalogos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own catalogo_productos" ON catalogo_productos FOR ALL
  USING (catalogo_id IN (SELECT id FROM catalogos WHERE user_id = auth.uid()));

CREATE POLICY "Users can CRUD own clientes_fiado" ON clientes_fiado FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own ventas_fiado" ON ventas_fiado FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own pagos_fiado" ON pagos_fiado FOR ALL
  USING (venta_id IN (SELECT id FROM ventas_fiado WHERE user_id = auth.uid()));

-- Public access for catalogo público (read-only, no auth needed)
CREATE POLICY "Public can view profiles with slug" ON profiles FOR SELECT
  USING (slug IS NOT NULL);
CREATE POLICY "Public can view active catalogos" ON catalogos FOR SELECT USING (activo = true);
CREATE POLICY "Public can view productos in active catalogos" ON productos FOR SELECT
  USING (activo = true AND id IN (
    SELECT producto_id FROM catalogo_productos
    WHERE catalogo_id IN (SELECT id FROM catalogos WHERE activo = true)
  ));
CREATE POLICY "Public can view catalogo_productos" ON catalogo_productos FOR SELECT
  USING (catalogo_id IN (SELECT id FROM catalogos WHERE activo = true));

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
