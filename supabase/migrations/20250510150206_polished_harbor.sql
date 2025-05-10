/*
  # Add RLS policies for TV shows table

  1. Security
    - Enable RLS on `tvshow` table
    - Add policy for authenticated users to read all TV show data
*/

-- Enable RLS
ALTER TABLE tvshow ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all TV shows
CREATE POLICY "Allow authenticated users to read TV shows"
  ON tvshow
  FOR SELECT
  TO authenticated
  USING (true);