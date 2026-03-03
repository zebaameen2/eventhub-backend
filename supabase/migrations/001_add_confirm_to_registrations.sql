-- Add confirm column to registrations table if it doesn't exist
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS confirm TEXT DEFAULT 'pending';
