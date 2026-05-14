-- Abonos (payments) for credit sales with detailed tracking
CREATE TABLE abonos_fiado (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venta_fiado_id UUID NOT NULL REFERENCES ventas_fiado(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  monto DECIMAL(10,2) NOT NULL,
  saldo_restante DECIMAL(10,2) NOT NULL, -- Balance after this payment
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_abonos_fiado_venta ON abonos_fiado(venta_fiado_id);
CREATE INDEX idx_abonos_fiado_user ON abonos_fiado(user_id);
CREATE INDEX idx_abonos_fiado_fecha ON abonos_fiado(user_id, fecha);

-- Enable RLS
ALTER TABLE abonos_fiado ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can CRUD own abonos_fiado" ON abonos_fiado FOR ALL USING (auth.uid() = user_id);
