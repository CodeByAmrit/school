-- Migration to add payment_status to teacher table
ALTER TABLE teacher ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';
