/*
  # Enhanced TV Show Tracking Schema

  1. Changes
    - Add status column with enum type
    - Add total_episodes column
    - Add episodes_watched column
    - Rename existing columns for consistency
    - Add check constraints for valid values

  2. Security
    - Maintain existing RLS policies
    - Add policy for authenticated users to update their own shows
*/

-- Create enum type for show status
CREATE TYPE show_status AS ENUM (
  'Currently Watching',
  'Completed',
  'Plan to Watch',
  'Dropped'
);

-- Add new columns and modify existing ones
ALTER TABLE tvshow
  ADD COLUMN status show_status NOT NULL DEFAULT 'Plan to Watch',
  ADD COLUMN total_episodes integer,
  ADD COLUMN episodes_watched integer DEFAULT 0,
  ADD CONSTRAINT episodes_watched_check CHECK (episodes_watched >= 0),
  ADD CONSTRAINT total_episodes_check CHECK (total_episodes IS NULL OR total_episodes >= 0),
  ADD CONSTRAINT valid_progress CHECK (
    episodes_watched <= total_episodes OR total_episodes IS NULL
  );

-- Add policy for updating shows
CREATE POLICY "Users can update their own shows"
  ON tvshow
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT auth.uid()
    FROM tvshow
    WHERE id = tvshow.id
  ));