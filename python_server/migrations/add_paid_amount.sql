-- Add paid_amount column to tickets table with default value of 0
ALTER TABLE tickets ADD COLUMN paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
