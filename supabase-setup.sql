-- =============================================
-- Team-Up: Setup do banco no Supabase
-- Execute no SQL Editor do painel do Supabase
-- =============================================

-- 1. Criar tabela de reservas
CREATE TABLE IF NOT EXISTS reservations (
  id          BIGSERIAL PRIMARY KEY,
  professor_name  TEXT NOT NULL,
  equipment_type  TEXT NOT NULL,
  date            DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  subject         TEXT,
  class_name      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar Row Level Security
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 3. Política: usuários autenticados podem ler todas as reservas
CREATE POLICY "Authenticated users can read reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (true);

-- 4. Política: usuários autenticados podem criar reservas
CREATE POLICY "Authenticated users can create reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Política: usuários autenticados podem deletar reservas
CREATE POLICY "Authenticated users can delete reservations"
  ON reservations FOR DELETE
  TO authenticated
  USING (true);

-- 6. Política: usuários autenticados podem atualizar reservas
CREATE POLICY "Authenticated users can update reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (true);
