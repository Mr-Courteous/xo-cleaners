-- First disable foreign key constraints
SET session_replication_role = 'replica';

-- Clear all tables in reverse order of dependencies
TRUNCATE TABLE ticket_items CASCADE;
TRUNCATE TABLE racks CASCADE;
TRUNCATE TABLE tickets CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE clothing_types CASCADE;

-- Reset sequences
ALTER SEQUENCE tickets_id_seq RESTART WITH 1;
ALTER SEQUENCE customers_id_seq RESTART WITH 1;
ALTER SEQUENCE clothing_types_id_seq RESTART WITH 1;
ALTER SEQUENCE ticket_items_id_seq RESTART WITH 1;
ALTER SEQUENCE racks_id_seq RESTART WITH 1;

-- Re-enable foreign key constraints
SET session_replication_role = 'origin';

-- Create default racks (numbers 1-20)
INSERT INTO racks (number, is_occupied, updated_at)
SELECT generate_series(1, 20), false, CURRENT_TIMESTAMP;
