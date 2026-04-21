-- Add trial_notified_days column to track which reminder emails have been sent
-- This prevents duplicate emails when CRON runs multiple times per day
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "trial_notified_days" jsonb;

-- Comment: stores array of days-before-expiry when emails were sent, e.g. [7, 3, 1, 0]
