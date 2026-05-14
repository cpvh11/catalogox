-- Ventas table (cash sales)
CREATE TABLE ventas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre TEXT, -- For anonymous sales or quick reference
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  costo_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Venta line items
CREATE TABLE venta_productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  producto_nombre TEXT NOT NULL, -- Snapshot of product name at time of sale
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ventas_user_id ON ventas(user_id);
CREATE INDEX idx_ventas_fecha ON ventas(user_id, fecha);
CREATE INDEX idx_ventas_cliente_id ON ventas(cliente_id);
CREATE INDEX idx_venta_productos_venta_id ON venta_productos(venta_id);

-- Enable RLS
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_productos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can CRUD own ventas" ON ventas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own venta_productos" ON venta_productos FOR ALL
  USING (venta_id IN (SELECT id FROM ventas WHERE user_id = auth.uid()));
