-- Add fecha_liquidacion to ventas_fiado for tracking expected payment date
ALTER TABLE ventas_fiado ADD COLUMN IF NOT EXISTS fecha_liquidacion DATE;

-- Index for querying by liquidation date
CREATE INDEX IF NOT EXISTS idx_ventas_fiado_fecha_liquidacion ON ventas_fiado(user_id, fecha_liquidacion);
