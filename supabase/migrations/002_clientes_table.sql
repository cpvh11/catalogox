-- Clientes table (general customers, not just fiado)
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_clientes_user_id ON clientes(user_id);
CREATE INDEX idx_clientes_nombre ON clientes(user_id, nombre);

-- Enable RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: users can only access their own clients
CREATE POLICY "Users can CRUD own clientes" ON clientes FOR ALL USING (auth.uid() = user_id);

-- Add cliente_id reference to ventas_fiado (optional, for linking)
-- We keep cliente_id in clientes_fiado for backwards compatibility
-- but add a general_cliente_id for linking to the main clientes table
ALTER TABLE clientes_fiado ADD COLUMN IF NOT EXISTS general_cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;
