-- Migration: Add Multi-Tenant & Subscription Support
-- Adds custom domain support and tiered subscriptions to the teacher table.

ALTER TABLE teacher 
ADD COLUMN subscription_tier ENUM('FREE', 'PREMIUM') DEFAULT 'FREE',
ADD COLUMN custom_domain VARCHAR(255) UNIQUE NULL,
ADD COLUMN subscription_expires_at TIMESTAMP NULL;

-- Automatically upgrade existing teachers to PREMIUM
UPDATE teacher SET subscription_tier = 'PREMIUM';

-- Create an index for domain lookups
CREATE INDEX idx_custom_domain ON teacher (custom_domain);
