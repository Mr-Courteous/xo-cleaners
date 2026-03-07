-- Add sequence columns to organization_settings for ticket numbering
ALTER TABLE organization_settings ADD COLUMN sequence_strategy VARCHAR(20) DEFAULT 'daily';
ALTER TABLE organization_settings ADD COLUMN current_sequence INTEGER DEFAULT 1;
ALTER TABLE organization_settings ADD COLUMN last_sequence_date DATE;