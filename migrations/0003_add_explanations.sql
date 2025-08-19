-- Add explanation field to questions table
-- Migration: 0003_add_explanations.sql

ALTER TABLE questions ADD COLUMN explanation TEXT;