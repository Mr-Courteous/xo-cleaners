-- Migration: Make tickets.customer_id reference allUsers(id) and add organization_id to ticket_items
-- File: python_server/migrations/0003_tickets_allusers.sql
-- WARNING: Run this on a backup or non-production DB first. Review constraints names in your DB before running.

BEGIN;

-- 1) Drop the existing FK from tickets.customer_id -> customers(id)
ALTER TABLE IF EXISTS tickets
DROP CONSTRAINT IF EXISTS tickets_customer_id_fkey;

-- 2) Add FK from tickets.customer_id -> allUsers(id)
ALTER TABLE tickets
ADD CONSTRAINT tickets_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES allUsers(id) ON DELETE RESTRICT;

-- 3) Add organization_id to ticket_items (if not exists)
ALTER TABLE ticket_items
ADD COLUMN IF NOT EXISTS organization_id INTEGER;

-- 4) Backfill organization_id on existing ticket_items from tickets table
UPDATE ticket_items
SET organization_id = t.organization_id
FROM tickets t
WHERE ticket_items.ticket_id = t.id
  AND ticket_items.organization_id IS NULL;

-- 5) Create index on organization_id for performance
CREATE INDEX IF NOT EXISTS idx_ticket_items_org ON ticket_items (organization_id);

-- 6) (Optional) Add FK constraint from ticket_items.organization_id to organizations(id)
-- Uncomment and adjust if you have an organizations table
-- ALTER TABLE ticket_items
-- ADD CONSTRAINT ticket_items_org_fk
-- FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

COMMIT;

-- To apply this migration using psql:
-- psql "postgresql://USER:PASS@HOST:PORT/DBNAME" -f python_server/migrations/0003_tickets_allusers.sql
-- Example (PowerShell):
-- $env:PGCONN="postgresql://postgres:postgres@localhost:5433/cleanpress";
-- psql $env:PGCONN -f .\\python_server\\migrations\\0003_tickets_allusers.sql

-- After running: restart backend and test ticket creation.
