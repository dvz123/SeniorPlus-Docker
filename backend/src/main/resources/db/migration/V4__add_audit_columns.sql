-- Add audit columns to tables that inherit BaseEntity but were created without them
-- This aligns DB schema (snake_case) with JPA BaseEntity fields (createdAt/updatedAt)

-- Some MySQL/MariaDB variants don't support IF NOT EXISTS for ADD COLUMN reliably.
-- Apply separate ALTER statements to avoid syntax issues.
ALTER TABLE mensagens
  ADD COLUMN created_at DATETIME NULL;
ALTER TABLE mensagens
  ADD COLUMN updated_at DATETIME NULL;

ALTER TABLE eventos
  ADD COLUMN created_at DATETIME NULL;
ALTER TABLE eventos
  ADD COLUMN updated_at DATETIME NULL;
